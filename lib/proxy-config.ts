/**
 * 代理服务配置管理
 * 用于检查环境变量中的代理服务开关状态
 */

export interface ProxyConfig {
  llmProxyEnabled: boolean;
  webdavProxyEnabled: boolean;
}

export class ProxyConfigService {
  /**
   * 获取代理服务配置
   */
  static getProxyConfig(): ProxyConfig {
    return {
      llmProxyEnabled: process.env.ENABLE_LLM_PROXY === 'true',
      webdavProxyEnabled: process.env.ENABLE_WEBDAV_PROXY === 'true'
    };
  }

  /**
   * 检查LLM代理是否启用
   */
  static isLLMProxyEnabled(): boolean {
    return process.env.ENABLE_LLM_PROXY === 'true';
  }

  /**
   * 检查WebDAV代理是否启用
   */
  static isWebDAVProxyEnabled(): boolean {
    return process.env.ENABLE_WEBDAV_PROXY === 'true';
  }

  /**
   * 获取代理服务状态信息（用于前端显示）
   */
  static getProxyStatus() {
    const config = this.getProxyConfig();
    return {
      llm: {
        enabled: config.llmProxyEnabled,
        message: config.llmProxyEnabled 
          ? 'LLM代理服务已启用' 
          : 'LLM代理服务已禁用，请联系管理员启用'
      },
      webdav: {
        enabled: config.webdavProxyEnabled,
        message: config.webdavProxyEnabled 
          ? 'WebDAV代理服务已启用' 
          : 'WebDAV代理服务已禁用，请联系管理员启用'
      }
    };
  }
}