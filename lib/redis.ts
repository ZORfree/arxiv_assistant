import { Redis as IORedis } from 'ioredis';

// 1. 静态读取环境变量（优化方案第 4 点）
const REDIS_CONFIG = {
  URL: process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL || '',
};

let ioRedis: IORedis | null = null;

// 2. 服务器启动日志（脱敏处理）
if (typeof window === 'undefined') {
  console.log('=== [Server Startup] Redis Configuration ===');
  if (REDIS_CONFIG.URL) {
    // 脱敏打印：显示协议和主机，隐藏密码
    try {
      const url = new URL(REDIS_CONFIG.URL);
      console.log(`- Connection: ${url.protocol}//${url.host}`);
    } catch {
      console.log(`- Connection: ${REDIS_CONFIG.URL.substring(0, 15)}...`);
    }
  } else {
    console.log('- Connection: None (Caching Disabled)');
  }
  console.log('===========================================');
}

// 3. 只有当配置了 URL 时才初始化 Redis 客户端
if (REDIS_CONFIG.URL) {
  if (REDIS_CONFIG.URL.startsWith('http')) {
    console.warn('[Redis] Detected HTTP/HTTPS URL. ioredis requires a redis:// or rediss:// protocol. Caching will be disabled.');
    ioRedis = null;
  } else {
    try {
      ioRedis = new IORedis(REDIS_CONFIG.URL, {
        maxRetriesPerRequest: 1, // 减少重试次数，快速失败
        connectTimeout: 2000,    // 连接超时 2s
        retryStrategy(times) {
          // 只有在前 3 次尝试时重试
          if (times <= 3) return Math.min(times * 50, 2000);
          return null; // 停止重试
        }
      });

      ioRedis.on('error', (err) => {
        // 静默处理连接错误
        if (!err.message.includes('ECONNREFUSED') && !err.message.includes('ETIMEDOUT')) {
          console.error('[Redis] Client Error:', err.message);
        }
      });
    } catch (error) {
      console.error('[Redis] Initialization Error:', error);
      ioRedis = null;
    }
  }
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
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (error) {
      console.error('[Redis] Get Error (non-blocking):', error);
      return null;
    }
  },

  set: async (key: string, value: unknown, options?: { ex?: number }) => {
    if (!ioRedis) return null;
    try {
      const val = typeof value === 'string' ? value : JSON.stringify(value);
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