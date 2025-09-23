/**
 * WebDAV代理客户端库
 * 通过Next.js API代理解决CORS问题
 */

import { WebDAVConfig } from './config';

export interface WebDAVFile {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
}

export class WebDAVProxyClient {
  private config: WebDAVConfig;

  constructor(config: WebDAVConfig) {
    this.config = config;
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
   * 通过代理发送WebDAV请求
   */
  private async proxyRequest(method: string, path: string, headers: Record<string, string> = {}, data?: string) {
    const url = this.normalizeUrl(path);
    
    const response = await fetch('/api/webdav', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method,
        url,
        headers,
        data,
        config: this.config
      })
    });

    if (!response.ok) {
      throw new Error(`代理请求失败: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 创建目录（如果不存在）
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      // 先检查目录是否存在
      const checkResult = await this.proxyRequest('PROPFIND', dirPath, { 'Depth': '0' });
      
      if (checkResult.status === 404) {
        // 目录不存在，创建它
        const createResult = await this.proxyRequest('MKCOL', dirPath);
        
        if (!createResult.success && createResult.status !== 405) {
          // 405 Method Not Allowed 可能表示目录已存在
          throw new Error(`创建目录失败: ${createResult.status} ${createResult.statusText}`);
        }
      } else if (!checkResult.success && checkResult.status !== 207) {
        throw new Error(`检查目录失败: ${checkResult.status} ${checkResult.statusText}`);
      }
    } catch (error) {
      throw new Error(`目录操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 上传文件到WebDAV服务器
   */
  async uploadFile(fileName: string, content: string): Promise<{ success: boolean; message: string }> {
    try {
      // 确保应用目录存在
      await this.ensureDirectory('');
      
      const result = await this.proxyRequest('PUT', fileName, {
        'Content-Type': 'application/json; charset=utf-8'
      }, content);

      if (result.success || result.status === 201 || result.status === 204) {
        return {
          success: true,
          message: `文件 ${fileName} 上传成功`
        };
      } else if (result.status === 401) {
        return {
          success: false,
          message: 'WebDAV认证失败，请检查用户名和密码'
        };
      } else if (result.status === 403) {
        return {
          success: false,
          message: 'WebDAV访问被拒绝，请检查权限设置'
        };
      } else {
        return {
          success: false,
          message: `上传失败: ${result.status} ${result.statusText || result.error}`
        };
      }
    } catch (error) {
      console.error('WebDAV upload error:', error);
      return {
        success: false,
        message: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 从WebDAV服务器下载文件
   */
  async downloadFile(fileName: string): Promise<{ success: boolean; message: string; content?: string }> {
    try {
      const result = await this.proxyRequest('GET', fileName);

      if (result.success) {
        return {
          success: true,
          message: `文件 ${fileName} 下载成功`,
          content: result.data
        };
      } else if (result.status === 404) {
        return {
          success: false,
          message: `文件 ${fileName} 不存在`
        };
      } else if (result.status === 401) {
        return {
          success: false,
          message: 'WebDAV认证失败，请检查用户名和密码'
        };
      } else if (result.status === 403) {
        return {
          success: false,
          message: 'WebDAV访问被拒绝，请检查权限设置'
        };
      } else {
        return {
          success: false,
          message: `下载失败: ${result.status} ${result.statusText || result.error}`
        };
      }
    } catch (error) {
      console.error('WebDAV download error:', error);
      return {
        success: false,
        message: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 列出WebDAV服务器上的文件
   */
  async listFiles(): Promise<{ success: boolean; message: string; files?: WebDAVFile[] }> {
    try {
      const result = await this.proxyRequest('PROPFIND', '', { 'Depth': '1' });

      if (result.success || result.status === 207) {
        const files = this.parseWebDAVResponse(result.data);
        
        return {
          success: true,
          message: `找到 ${files.length} 个文件`,
          files: files
        };
      } else if (result.status === 401) {
        return {
          success: false,
          message: 'WebDAV认证失败，请检查用户名和密码'
        };
      } else if (result.status === 403) {
        return {
          success: false,
          message: 'WebDAV访问被拒绝，请检查权限设置'
        };
      } else {
        return {
          success: false,
          message: `列出文件失败: ${result.status} ${result.statusText || result.error}`
        };
      }
    } catch (error) {
      console.error('WebDAV list files error:', error);
      return {
        success: false,
        message: `列出文件失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
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
      
      // 尝试多种方式获取响应节点
      let responses = xmlDoc.getElementsByTagNameNS('DAV:', 'response');
      if (responses.length === 0) {
        responses = xmlDoc.getElementsByTagName('d:response');
      }
      if (responses.length === 0) {
        responses = xmlDoc.getElementsByTagName('response');
      }
      
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        
        // 获取文件路径 - 尝试多种命名空间
        let hrefElement = response.getElementsByTagNameNS('DAV:', 'href')[0];
        if (!hrefElement) {
          hrefElement = response.getElementsByTagName('d:href')[0];
        }
        if (!hrefElement) {
          hrefElement = response.getElementsByTagName('href')[0];
        }
        
        if (!hrefElement) {
          continue;
        }
        
        const href = hrefElement.textContent || '';
        const fileName = decodeURIComponent(href.split('/').pop() || '');
        
        // 更宽松的过滤条件
        if (!fileName || fileName === '') {
          continue;
        }
        
        // 只跳过明确的目录路径
        if (href.endsWith('/paper-research-tool/') || href.endsWith('/paper-research-tool')) {
          continue;
        }
        
        // 获取文件大小 - 尝试多种命名空间
        let sizeElement = response.getElementsByTagNameNS('DAV:', 'getcontentlength')[0];
        if (!sizeElement) {
          sizeElement = response.getElementsByTagName('d:getcontentlength')[0];
        }
        if (!sizeElement) {
          sizeElement = response.getElementsByTagName('getcontentlength')[0];
        }
        const size = sizeElement ? parseInt(sizeElement.textContent || '0') : 0;
        
        // 获取最后修改时间 - 尝试多种命名空间
        let modifiedElement = response.getElementsByTagNameNS('DAV:', 'getlastmodified')[0];
        if (!modifiedElement) {
          modifiedElement = response.getElementsByTagName('d:getlastmodified')[0];
        }
        if (!modifiedElement) {
          modifiedElement = response.getElementsByTagName('getlastmodified')[0];
        }
        const lastModified = modifiedElement ? new Date(modifiedElement.textContent || '') : new Date();
        
        // 检查是否为目录 - 尝试多种命名空间
        let resourceTypeElement = response.getElementsByTagNameNS('DAV:', 'resourcetype')[0];
        if (!resourceTypeElement) {
          resourceTypeElement = response.getElementsByTagName('d:resourcetype')[0];
        }
        if (!resourceTypeElement) {
          resourceTypeElement = response.getElementsByTagName('resourcetype')[0];
        }
        
        let isDirectory = false;
        if (resourceTypeElement) {
          const collectionElements = resourceTypeElement.getElementsByTagNameNS('DAV:', 'collection');
          const dCollectionElements = resourceTypeElement.getElementsByTagName('d:collection');
          const plainCollectionElements = resourceTypeElement.getElementsByTagName('collection');
          isDirectory = collectionElements.length > 0 || dCollectionElements.length > 0 || plainCollectionElements.length > 0;
        }
        
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
      const result = await this.proxyRequest('DELETE', fileName);

      if (result.success || result.status === 204) {
        return {
          success: true,
          message: `文件 ${fileName} 删除成功`
        };
      } else if (result.status === 404) {
        return {
          success: false,
          message: `文件 ${fileName} 不存在`
        };
      } else if (result.status === 401) {
        return {
          success: false,
          message: 'WebDAV认证失败，请检查用户名和密码'
        };
      } else if (result.status === 403) {
        return {
          success: false,
          message: 'WebDAV访问被拒绝，请检查权限设置'
        };
      } else {
        return {
          success: false,
          message: `删除失败: ${result.status} ${result.statusText || result.error}`
        };
      }
    } catch (error) {
      console.error('WebDAV delete error:', error);
      return {
        success: false,
        message: `删除失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
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

      const optionsResult = await this.proxyRequest('OPTIONS', '');

      if (optionsResult.success) {
        const allowHeader = optionsResult.headers?.allow || '';
        const davHeader = optionsResult.headers?.dav || '';
        
        if (allowHeader.includes('PROPFIND') || davHeader.includes('1')) {
          return {
            success: true,
            message: 'WebDAV连接测试成功！',
            details: `服务器支持WebDAV协议。响应状态: ${optionsResult.status} ${optionsResult.statusText}`
          };
        }
      }

      // 如果OPTIONS失败，尝试PROPFIND
      const propfindResult = await this.proxyRequest('PROPFIND', '', { 'Depth': '0' });

      if (propfindResult.success || propfindResult.status === 207) {
        return {
          success: true,
          message: 'WebDAV连接测试成功！',
          details: `服务器响应状态: ${propfindResult.status} ${propfindResult.statusText}`
        };
      } else if (propfindResult.status === 401) {
        return {
          success: false,
          message: 'WebDAV认证失败',
          details: '用户名或密码错误，请检查您的凭据'
        };
      } else if (propfindResult.status === 403) {
        return {
          success: false,
          message: 'WebDAV访问被拒绝',
          details: '您的账户可能没有访问此路径的权限'
        };
      } else {
        return {
          success: false,
          message: 'WebDAV连接失败',
          details: `服务器响应: ${propfindResult.status} ${propfindResult.statusText || propfindResult.error}`
        };
      }
    } catch (error) {
      console.error('WebDAV connection test error:', error);
      return {
        success: false,
        message: '连接测试失败',
        details: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
}