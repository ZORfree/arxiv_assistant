import { Redis as IORedis } from 'ioredis';

// 获取 Redis URL，支持多种可能的变量名
const redisUrl = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || process.env.NEXT_PUBLIC_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;

let ioRedis: IORedis | null = null;

// 只有当配置了 URL 时才初始化 Redis 客户端
if (redisUrl) {
  if (redisUrl.startsWith('http')) {
    console.warn('[Redis] Detected HTTP/HTTPS URL. ioredis requires a redis:// or rediss:// protocol. Caching will be disabled.');
    ioRedis = null;
  } else {
    try {
      ioRedis = new IORedis(redisUrl, {
        maxRetriesPerRequest: 1, // 减少重试次数，快速失败
        connectTimeout: 2000,    // 连接超时 2s
        retryStrategy(times) {
          // 只有在前 3 次尝试时重试
          if (times <= 3) return Math.min(times * 50, 2000);
          return null; // 停止重试
        }
      });

      ioRedis.on('error', (err) => {
        // 静默处理连接错误，不打印堆栈
        if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
          // 仅在初次连接失败时警告一次即可，避免日志污染
        } else {
          console.error('[Redis] Client Error:', err.message);
        }
      });
    } catch (error) {
      console.error('[Redis] Initialization Error:', error);
      ioRedis = null;
    }
  }
} else {
  console.log('[Redis] No REDIS_URL found. Caching will be disabled.');
}

/**
 * 提供一个兼容层，使现有代码无需修改即可从 @upstash/redis 迁移到 ioredis
 * 主要处理 JSON 的自动序列化和反序列化
 */
const redis = {
  get: async <T>(key: string): Promise<T | null> => {
    if (!ioRedis) return null;
    try {
      // 给 Redis 操作加一个 1 秒的超时限制，防止连接卡死导致主业务失败
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 1000)
      );
      
      const redisPromise = ioRedis.get(key);
      
      const data = await Promise.race([redisPromise, timeoutPromise]);
      
      if (!data) return null;
      try {
        // 尝试解析为 JSON
        return JSON.parse(data) as T;
      } catch {
        // 如果不是 JSON，直接返回原始数据
        return data as unknown as T;
      }
    } catch (error) {
      console.error('[Redis] Get Error (non-blocking):', error);
      return null;
    }
  },

  set: async (key: string, value: any, options?: { ex?: number }) => {
    if (!ioRedis) return null;
    try {
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      
      // 同样给 set 操作加超时，虽然它是异步的，但防止 await 卡住
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 1000)
      );

      let redisPromise;
      if (options?.ex) {
        redisPromise = ioRedis.set(key, val, 'EX', options.ex);
      } else {
        redisPromise = ioRedis.set(key, val);
      }

      return await Promise.race([redisPromise, timeoutPromise]);
    } catch (error) {
      console.error('[Redis] Set Error (non-blocking):', error);
      return null;
    }
  },

  // 如果后续需要其他方法，可以在此添加
  del: async (key: string) => {
    if (!ioRedis) return 0;
    try {
        return await ioRedis.del(key);
    } catch (error) {
        console.error('[Redis] Del Error:', error);
        return 0;
    }
  }
};

export default redis;