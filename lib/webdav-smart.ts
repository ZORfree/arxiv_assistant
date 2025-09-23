/**
 * 智能WebDAV客户端
 * 根据配置自动选择直连或代理方式
 */

import { WebDAVConfig } from './config';
import { WebDAVClient } from './webdav';
import { WebDAVProxyClient, WebDAVFile } from './webdav-proxy';

export class SmartWebDAVClient {
  private client: WebDAVClient | WebDAVProxyClient;
  private config: WebDAVConfig;

  constructor(config: WebDAVConfig) {
    this.config = config;
    
    // 根据配置选择客户端类型
    // 默认使用代理（useProxy未设置或为true时）
    if (config.useProxy === false) {
      this.client = new WebDAVClient(config);
    } else {
      this.client = new WebDAVProxyClient(config);
    }
  }

  /**
   * 获取当前使用的连接方式
   */
  getConnectionType(): 'direct' | 'proxy' {
    return this.config.useProxy === false ? 'direct' : 'proxy';
  }

  /**
   * 上传文件到WebDAV服务器
   */
  async uploadFile(fileName: string, content: string): Promise<{ success: boolean; message: string }> {
    return await this.client.uploadFile(fileName, content);
  }

  /**
   * 从WebDAV服务器下载文件
   */
  async downloadFile(fileName: string): Promise<{ success: boolean; message: string; content?: string }> {
    return await this.client.downloadFile(fileName);
  }

  /**
   * 列出WebDAV服务器上的文件
   */
  async listFiles(): Promise<{ success: boolean; message: string; files?: WebDAVFile[] }> {
    return await this.client.listFiles();
  }

  /**
   * 删除文件
   */
  async deleteFile(fileName: string): Promise<{ success: boolean; message: string }> {
    return await this.client.deleteFile(fileName);
  }

  /**
   * 测试WebDAV连接
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: string; isWarning?: boolean }> {
    const result = await this.client.testConnection();
    
    // 为直连方式添加额外的说明信息
    if (this.getConnectionType() === 'direct') {
      if (!result.success && result.message.includes('CORS')) {
        return {
          ...result,
          message: 'CORS策略限制 - 建议启用服务器代理',
          details: `${result.details || ''}

当前使用直连模式，遇到了CORS限制。建议：
✓ 启用"使用服务器代理"选项来解决此问题
✓ 或者联系WebDAV服务提供商配置CORS策略

如果您的WebDAV服务器支持跨域访问，可以忽略此警告。`,
          isWarning: true
        };
      } else if (result.success) {
        return {
          ...result,
          details: `${result.details || ''}

✓ 直连模式测试成功！您的WebDAV服务器支持跨域访问。`
        };
      }
    } else {
      // 代理模式
      if (result.success) {
        return {
          ...result,
          details: `${result.details || ''}

✓ 服务器代理模式测试成功！通过代理服务器连接WebDAV。`
        };
      }
    }
    
    return result;
  }

  /**
   * 自动检测最佳连接方式
   * 先尝试直连，如果失败则建议使用代理
   */
  async detectBestConnectionMode(): Promise<{
    success: boolean;
    recommendedMode: 'direct' | 'proxy';
    directResult?: { success: boolean; message: string; details?: string };
    proxyResult?: { success: boolean; message: string; details?: string };
    recommendation: string;
  }> {
    const results: any = {
      success: false,
      recommendedMode: 'proxy' as const,
      recommendation: ''
    };

    try {
      // 测试直连模式
      const directConfig = { ...this.config, useProxy: false };
      const directClient = new WebDAVClient(directConfig);
      const directResult = await directClient.testConnection();
      results.directResult = directResult;

      // 测试代理模式
      const proxyConfig = { ...this.config, useProxy: true };
      const proxyClient = new SmartWebDAVClient(proxyConfig);
      const proxyResult = await proxyClient.testConnection();
      results.proxyResult = proxyResult;

      // 分析结果并给出建议
      if (directResult.success && proxyResult.success) {
        results.success = true;
        results.recommendedMode = 'direct';
        results.recommendation = '两种连接方式都可用。建议使用直连模式以获得更好的性能。';
      } else if (directResult.success && !proxyResult.success) {
        results.success = true;
        results.recommendedMode = 'direct';
        results.recommendation = '建议使用直连模式。您的WebDAV服务器支持跨域访问。';
      } else if (!directResult.success && proxyResult.success) {
        results.success = true;
        results.recommendedMode = 'proxy';
        results.recommendation = '建议使用服务器代理模式。直连模式受到CORS限制。';
      } else {
        results.success = false;
        results.recommendedMode = 'proxy';
        results.recommendation = '两种连接方式都失败。请检查WebDAV配置信息。';
      }

    } catch (error) {
      results.success = false;
      results.recommendation = `检测过程中出现错误: ${error instanceof Error ? error.message : '未知错误'}`;
    }

    return results;
  }
}