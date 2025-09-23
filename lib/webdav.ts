/**
 * WebDAV客户端库
 * 用于处理WebDAV服务器的文件上传、下载和管理操作
 */

import { WebDAVConfig } from './config';

export interface WebDAVFile {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
}

export class WebDAVClient {
  private config: WebDAVConfig;
  private authHeader: string;

  constructor(config: WebDAVConfig) {
    this.config = config;
    this.authHeader = `Basic ${btoa(`${config.username}:${config.password}`)}`;
  }

  /**
   * 确保URL格式正确
   */
  private normalizeUrl(path: string = ''): string {
    let baseUrl = this.config.url.trim();
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    
    // 添加应用专用目录
    const appDir = 'paper-research-tool/';
    
    if (path) {
      return baseUrl + appDir + path.replace(/^\/+/, '');
    }
    return baseUrl + appDir;
  }

  /**
   * 创建目录（如果不存在）
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    const url = this.normalizeUrl(dirPath);
    
    try {
      // 先检查目录是否存在
      const response = await fetch(url, {
        method: 'PROPFIND',
        headers: {
          'Authorization': this.authHeader,
          'Depth': '0'
        },
        body: null,
        mode: 'cors',
        credentials: 'include'
      });

      if (response.status === 404) {
        // 目录不存在，创建它
        const createResponse = await fetch(url, {
          method: 'MKCOL',
          headers: {
            'Authorization': this.authHeader
          },
          mode: 'cors',
          credentials: 'include'
        });

        if (!createResponse.ok && createResponse.status !== 405) {
          // 405 Method Not Allowed 可能表示目录已存在
          throw new Error(`创建目录失败: ${createResponse.status} ${createResponse.statusText}`);
        }
      } else if (!response.ok && response.status !== 207) {
        throw new Error(`检查目录失败: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查WebDAV服务器地址和网络连接');
      }
      throw error;
    }
  }

  /**
   * 上传文件到WebDAV服务器
   */
  async uploadFile(fileName: string, content: string): Promise<{ success: boolean; message: string }> {
    try {
      // 确保应用目录存在
      await this.ensureDirectory('');
      
      const url = this.normalizeUrl(fileName);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: content,
        mode: 'cors',
        credentials: 'include'
      });

      if (response.ok || response.status === 201 || response.status === 204) {
        return {
          success: true,
          message: `文件 ${fileName} 上传成功`
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'WebDAV认证失败，请检查用户名和密码'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          message: 'WebDAV访问被拒绝，请检查权限设置'
        };
      } else {
        return {
          success: false,
          message: `上传失败: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('WebDAV upload error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message: '网络连接失败，请检查WebDAV服务器地址和网络连接'
        };
      } else if (error instanceof Error && error.message.includes('CORS')) {
        return {
          success: false,
          message: 'CORS策略限制，请联系管理员配置服务器允许跨域访问'
        };
      } else {
        return {
          success: false,
          message: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`
        };
      }
    }
  }

  /**
   * 从WebDAV服务器下载文件
   */
  async downloadFile(fileName: string): Promise<{ success: boolean; message: string; content?: string }> {
    try {
      const url = this.normalizeUrl(fileName);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.authHeader
        },
        mode: 'cors',
        credentials: 'include'
      });

      if (response.ok) {
        const content = await response.text();
        return {
          success: true,
          message: `文件 ${fileName} 下载成功`,
          content: content
        };
      } else if (response.status === 404) {
        return {
          success: false,
          message: `文件 ${fileName} 不存在`
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'WebDAV认证失败，请检查用户名和密码'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          message: 'WebDAV访问被拒绝，请检查权限设置'
        };
      } else {
        return {
          success: false,
          message: `下载失败: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('WebDAV download error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message: '网络连接失败，请检查WebDAV服务器地址和网络连接'
        };
      } else if (error instanceof Error && error.message.includes('CORS')) {
        return {
          success: false,
          message: 'CORS策略限制，请联系管理员配置服务器允许跨域访问'
        };
      } else {
        return {
          success: false,
          message: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`
        };
      }
    }
  }

  /**
   * 列出WebDAV服务器上的文件
   */
  async listFiles(): Promise<{ success: boolean; message: string; files?: WebDAVFile[] }> {
    try {
      // 确保应用目录存在
      await this.ensureDirectory('');
      
      const url = this.normalizeUrl('');
      
      const response = await fetch(url, {
        method: 'PROPFIND',
        headers: {
          'Authorization': this.authHeader,
          'Depth': '1'
        },
        body: null,
        mode: 'cors',
        credentials: 'include'
      });

      if (response.ok || response.status === 207) {
        const xmlText = await response.text();
        const files = this.parseWebDAVResponse(xmlText);
        
        return {
          success: true,
          message: `找到 ${files.length} 个文件`,
          files: files
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'WebDAV认证失败，请检查用户名和密码'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          message: 'WebDAV访问被拒绝，请检查权限设置'
        };
      } else {
        return {
          success: false,
          message: `列出文件失败: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('WebDAV list files error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message: '网络连接失败，请检查WebDAV服务器地址和网络连接'
        };
      } else if (error instanceof Error && error.message.includes('CORS')) {
        return {
          success: false,
          message: 'CORS策略限制，请联系管理员配置服务器允许跨域访问'
        };
      } else {
        return {
          success: false,
          message: `列出文件失败: ${error instanceof Error ? error.message : '未知错误'}`
        };
      }
    }
  }

  /**
   * 解析WebDAV PROPFIND响应
   */
  private parseWebDAVResponse(xmlText: string): WebDAVFile[] {
    const files: WebDAVFile[] = [];
    
    try {
      // 简单的XML解析，提取文件信息
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const responses = xmlDoc.getElementsByTagName('response') || xmlDoc.getElementsByTagNameNS('DAV:', 'response');
      
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        
        // 获取文件路径
        const hrefElement = response.getElementsByTagName('href')[0] || response.getElementsByTagNameNS('DAV:', 'href')[0];
        if (!hrefElement) continue;
        
        const href = hrefElement.textContent || '';
        const fileName = decodeURIComponent(href.split('/').pop() || '');
        
        // 跳过目录本身和空文件名
        if (!fileName || fileName === '' || href.endsWith('/paper-research-tool/')) {
          continue;
        }
        
        // 获取文件大小
        const sizeElement = response.getElementsByTagName('getcontentlength')[0] || response.getElementsByTagNameNS('DAV:', 'getcontentlength')[0];
        const size = sizeElement ? parseInt(sizeElement.textContent || '0') : 0;
        
        // 获取最后修改时间
        const modifiedElement = response.getElementsByTagName('getlastmodified')[0] || response.getElementsByTagNameNS('DAV:', 'getlastmodified')[0];
        const lastModified = modifiedElement ? new Date(modifiedElement.textContent || '') : new Date();
        
        // 检查是否为目录
        const resourceTypeElement = response.getElementsByTagName('resourcetype')[0] || response.getElementsByTagNameNS('DAV:', 'resourcetype')[0];
        const isDirectory = resourceTypeElement ? 
          (resourceTypeElement.getElementsByTagName('collection').length > 0 || 
           resourceTypeElement.getElementsByTagNameNS('DAV:', 'collection').length > 0) : false;
        
        files.push({
          name: fileName,
          path: href,
          size: size,
          lastModified: lastModified,
          isDirectory: isDirectory
        });
      }
    } catch (error) {
      console.error('Error parsing WebDAV response:', error);
    }
    
    return files.filter(file => !file.isDirectory); // 只返回文件，不包括目录
  }

  /**
   * 删除文件
   */
  async deleteFile(fileName: string): Promise<{ success: boolean; message: string }> {
    try {
      const url = this.normalizeUrl(fileName);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': this.authHeader
        },
        mode: 'cors',
        credentials: 'include'
      });

      if (response.ok || response.status === 204) {
        return {
          success: true,
          message: `文件 ${fileName} 删除成功`
        };
      } else if (response.status === 404) {
        return {
          success: false,
          message: `文件 ${fileName} 不存在`
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'WebDAV认证失败，请检查用户名和密码'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          message: 'WebDAV访问被拒绝，请检查权限设置'
        };
      } else {
        return {
          success: false,
          message: `删除失败: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('WebDAV delete error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message: '网络连接失败，请检查WebDAV服务器地址和网络连接'
        };
      } else if (error instanceof Error && error.message.includes('CORS')) {
        return {
          success: false,
          message: 'CORS策略限制，请联系管理员配置服务器允许跨域访问'
        };
      } else {
        return {
          success: false,
          message: `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
        };
      }
    }
  }

  /**
   * 测试WebDAV连接
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: string }> {
    try {
      // 首先尝试OPTIONS请求
      let baseUrl = this.config.url.trim();
      if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
      }

      const response = await fetch(baseUrl, {
        method: 'OPTIONS',
        headers: {
          'Authorization': this.authHeader
        },
        mode: 'cors',
        credentials: 'include'
      });

      if (response.ok) {
        const allowHeader = response.headers.get('Allow') || '';
        const davHeader = response.headers.get('DAV') || '';
        
        if (allowHeader.includes('PROPFIND') || davHeader.includes('1')) {
          return {
            success: true,
            message: 'WebDAV连接测试成功！',
            details: `服务器支持WebDAV协议。响应状态: ${response.status} ${response.statusText}`
          };
        }
      }

      // 如果OPTIONS失败，尝试PROPFIND
      const propfindResponse = await fetch(baseUrl, {
        method: 'PROPFIND',
        headers: {
          'Authorization': this.authHeader,
          'Depth': '0'
        },
        body: null,
        mode: 'cors',
        credentials: 'include'
      });

      if (propfindResponse.ok || propfindResponse.status === 207) {
        return {
          success: true,
          message: 'WebDAV连接测试成功！',
          details: `服务器响应状态: ${propfindResponse.status} ${propfindResponse.statusText}`
        };
      } else if (propfindResponse.status === 401) {
        return {
          success: false,
          message: 'WebDAV认证失败',
          details: '用户名或密码错误，请检查您的凭据'
        };
      } else if (propfindResponse.status === 403) {
        return {
          success: false,
          message: 'WebDAV访问被拒绝',
          details: '您的账户可能没有访问此路径的权限'
        };
      } else {
        return {
          success: false,
          message: 'WebDAV连接失败',
          details: `服务器响应: ${propfindResponse.status} ${propfindResponse.statusText}`
        };
      }
    } catch (error) {
      console.error('WebDAV connection test error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          message: '网络连接失败',
          details: '无法连接到WebDAV服务器，请检查URL和网络连接'
        };
      } else if (error instanceof Error && error.message.includes('CORS')) {
        return {
          success: false,
          message: 'CORS策略限制',
          details: '浏览器的CORS安全策略阻止了对WebDAV服务器的直接访问。这在大多数WebDAV服务中都是正常现象。'
        };
      } else {
        return {
          success: false,
          message: '连接测试失败',
          details: error instanceof Error ? error.message : '未知错误'
        };
      }
    }
  }
}