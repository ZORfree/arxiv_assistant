/**
 * 前端代理状态管理
 * 用于检查代理服务状态
 * 移除了时间缓存，因为环境变量变更通常伴随重新部署
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
  private static ongoingRequest: Promise<ProxyStatus> | null = null;

  /**
   * 获取代理服务状态
   * 移除 5 分钟时间缓存，每次调用都会实时向后端确认
   * 使用 ongoingRequest 确保并发调用时只发起一个网络请求
   */
  static async getProxyStatus(): Promise<ProxyStatus> {
    // 如果当前已经有正在进行的请求，直接复用它，防止瞬间并发导致的重复请求
    if (this.ongoingRequest) {
      return this.ongoingRequest;
    }

    // 发起新请求并记录 Promise
    this.ongoingRequest = (async () => {
      try {
        const response = await fetch('/api/proxy-status');
        const result = await response.json();
        
        if (result.success && result.data) {
          return result.data;
        } else {
          throw new Error(result.error || '获取代理状态失败');
        }
      } catch (error) {
        console.error('[ProxyStatus] 获取失败:', error);
        // 返回默认状态（全禁用）
        return {
          llm: {
            enabled: false,
            message: '无法获取代理状态，请检查网络'
          },
          webdav: {
            enabled: false,
            message: '无法获取代理状态，请检查网络'
          }
        };
      } finally {
        // 请求结束后必须清空，确保下一次调用能发起新的 fetch
        this.ongoingRequest = null;
      }
    })();

    return this.ongoingRequest;
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