/**
 * 前端代理状态管理
 * 用于检查和缓存代理服务状态
 */

export interface ProxyStatus {
  llm: {
    enabled: boolean;
    message: string;
  };
  webdav: {
    enabled: boolean;
    message: string;
  };
}

export class ProxyStatusService {
  private static cache: ProxyStatus | null = null;
  private static cacheTime: number = 0;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取代理服务状态
   */
  static async getProxyStatus(): Promise<ProxyStatus> {
    // 检查缓存
    const now = Date.now();
    if (this.cache && (now - this.cacheTime) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      const response = await fetch('/api/proxy-status');
      const result = await response.json();
      
      if (result.success && result.data) {
        this.cache = result.data;
        this.cacheTime = now;
        return result.data;
      } else {
        throw new Error(result.error || '获取代理状态失败');
      }
    } catch (error) {
      console.error('获取代理状态失败:', error);
      // 返回默认状态（假设都禁用）
      const defaultStatus: ProxyStatus = {
        llm: {
          enabled: false,
          message: '无法获取LLM代理状态，请刷新页面重试'
        },
        webdav: {
          enabled: false,
          message: '无法获取WebDAV代理状态，请刷新页面重试'
        }
      };
      return defaultStatus;
    }
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    this.cache = null;
    this.cacheTime = 0;
  }

  /**
   * 检查LLM代理是否可用
   */
  static async isLLMProxyAvailable(): Promise<boolean> {
    const status = await this.getProxyStatus();
    return status.llm.enabled;
  }

  /**
   * 检查WebDAV代理是否可用
   */
  static async isWebDAVProxyAvailable(): Promise<boolean> {
    const status = await this.getProxyStatus();
    return status.webdav.enabled;
  }

  /**
   * 获取代理不可用时的提示信息
   */
  static async getUnavailableMessage(type: 'llm' | 'webdav'): Promise<string> {
    const status = await this.getProxyStatus();
    return type === 'llm' ? status.llm.message : status.webdav.message;
  }
}