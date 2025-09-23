import { UserPreference } from './ai';
import { FavoriteCategory, FavoritePaper, FavoritesService } from './favorites';
import { UserService } from './user';
import { SmartWebDAVClient } from './webdav-smart';
import { WebDAVFile } from './webdav-proxy';

// WebDAV配置接口
export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
  useProxy?: boolean; // 是否使用服务器代理，默认true
}

// 完整的用户配置接口
export interface UserConfig {
  // 用户偏好设置
  preferences: UserPreference;
  // WebDAV配置
  webdavConfig: WebDAVConfig;
  // 收藏分类
  favoriteCategories: FavoriteCategory[];
  // 收藏的论文
  favoritePapers: FavoritePaper[];
  // 用户ID
  userId: string;
  // 导出时间戳
  exportedAt: string;
  // 配置版本
  version: string;
}

export class ConfigService {
  private static readonly WEBDAV_CONFIG_KEY = 'webdav_config';
  private static readonly USER_PREFERENCES_KEY = 'user_preferences';
  private static readonly CONFIG_VERSION = '1.0.0';

  // 获取WebDAV配置
  static getWebDAVConfig(): WebDAVConfig {
    if (typeof window === 'undefined') {
      // 服务器端渲染时返回默认值
      return { url: '', username: '', password: '', useProxy: true };
    }
    
    try {
      const stored = localStorage.getItem(this.WEBDAV_CONFIG_KEY);
      const config = stored ? JSON.parse(stored) : { url: '', username: '', password: '', useProxy: true };
      
      // 确保useProxy字段存在，默认为true（使用代理）
      if (config.useProxy === undefined) {
        config.useProxy = true;
      }
      
      return config;
    } catch (error) {
      console.error('Error loading WebDAV config:', error);
      return { url: '', username: '', password: '', useProxy: true };
    }
  }

  // 保存WebDAV配置
  static saveWebDAVConfig(config: WebDAVConfig): void {
    if (typeof window === 'undefined') {
      return; // 服务器端不执行
    }
    
    try {
      localStorage.setItem(this.WEBDAV_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving WebDAV config:', error);
    }
  }

  // 获取用户偏好设置
  static getUserPreferences(): UserPreference {
    if (typeof window === 'undefined') {
      // 服务器端渲染时返回默认值
      return {
        profession: '',
        interests: [],
        nonInterests: [],
        apiConfig: {
          apiKey: '',
          apiBaseUrl: '',
          model: '',
          maxConcurrentRequests: 3
        },
        arxivProxyUrl: ''
      };
    }
    
    try {
      const stored = localStorage.getItem(this.USER_PREFERENCES_KEY);
      return stored ? JSON.parse(stored) : {
        profession: '',
        interests: [],
        nonInterests: [],
        apiConfig: {
          apiKey: '',
          apiBaseUrl: '',
          model: '',
          maxConcurrentRequests: 3
        },
        arxivProxyUrl: ''
      };
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return {
        profession: '',
        interests: [],
        nonInterests: [],
        apiConfig: {
          apiKey: '',
          apiBaseUrl: '',
          model: '',
          maxConcurrentRequests: 3
        },
        arxivProxyUrl: ''
      };
    }
  }

  // 保存用户偏好设置
  static saveUserPreferences(preferences: UserPreference): void {
    if (typeof window === 'undefined') {
      return; // 服务器端不执行
    }
    
    try {
      localStorage.setItem(this.USER_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  // 导出完整配置
  static exportConfig(): string {
    const config: UserConfig = {
      preferences: this.getUserPreferences(),
      webdavConfig: this.getWebDAVConfig(),
      favoriteCategories: FavoritesService.getCategories(),
      favoritePapers: FavoritesService.getFavorites(),
      userId: UserService.getUserId(),
      exportedAt: new Date().toISOString(),
      version: this.CONFIG_VERSION
    };

    return JSON.stringify(config, null, 2);
  }

  // 导入完整配置
  static importConfig(data: string): { success: boolean; message: string; details?: string } {
    try {
      const config: UserConfig = JSON.parse(data);

      // 验证配置格式
      if (!config || typeof config !== 'object') {
        return {
          success: false,
          message: '配置文件格式无效',
          details: '配置文件必须是有效的JSON对象'
        };
      }

      const importedItems: string[] = [];

      // 导入用户偏好设置
      if (config.preferences) {
        this.saveUserPreferences(config.preferences);
        importedItems.push('用户偏好设置');
      }

      // 导入WebDAV配置
      if (config.webdavConfig) {
        this.saveWebDAVConfig(config.webdavConfig);
        importedItems.push('WebDAV配置');
      }

      // 导入收藏分类
      if (config.favoriteCategories && Array.isArray(config.favoriteCategories)) {
        FavoritesService.saveCategories(config.favoriteCategories);
        importedItems.push('收藏分类');
      }

      // 导入收藏论文
      if (config.favoritePapers && Array.isArray(config.favoritePapers)) {
        if (typeof window !== 'undefined') {
          // 使用FavoritesService的私有方法需要通过反射或者添加公共方法
          localStorage.setItem('paper_favorites', JSON.stringify(config.favoritePapers));
          importedItems.push('收藏论文');
        }
      }

      if (importedItems.length === 0) {
        return {
          success: false,
          message: '配置文件中没有找到有效的配置数据',
          details: '请确保配置文件包含有效的用户设置、收藏数据等信息'
        };
      }

      return {
        success: true,
        message: `成功导入配置`,
        details: `已导入: ${importedItems.join('、')}`
      };

    } catch (error) {
      console.error('Error importing config:', error);
      return {
        success: false,
        message: '导入配置失败',
        details: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 重置所有配置
  static resetAllConfig(): void {
    if (typeof window === 'undefined') {
      return; // 服务器端不执行
    }
    
    try {
      // 清除用户偏好设置
      localStorage.removeItem(this.USER_PREFERENCES_KEY);
      
      // 清除WebDAV配置
      localStorage.removeItem(this.WEBDAV_CONFIG_KEY);
      
      // 清除收藏数据
      localStorage.removeItem('paper_favorites');
      localStorage.removeItem('favorite_categories');
      
      // 重置用户ID
      UserService.resetUserId();
      
      console.log('All configuration has been reset');
    } catch (error) {
      console.error('Error resetting config:', error);
    }
  }

  // 获取配置统计信息
  static getConfigStats(): {
    hasPreferences: boolean;
    hasWebDAVConfig: boolean;
    favoriteCategoriesCount: number;
    favoritePapersCount: number;
    lastExported?: string;
  } {
    const preferences = this.getUserPreferences();
    const webdavConfig = this.getWebDAVConfig();
    const categories = FavoritesService.getCategories();
    const papers = FavoritesService.getFavorites();

    return {
      hasPreferences: !!(preferences.profession || preferences.interests.length > 0 || preferences.apiConfig?.apiKey),
      hasWebDAVConfig: !!(webdavConfig.url && webdavConfig.username && webdavConfig.password),
      favoriteCategoriesCount: categories.length,
      favoritePapersCount: papers.length
    };
  }

  // WebDAV同步功能
  static async syncToWebDAV(): Promise<{ success: boolean; message: string; details?: string }> {
    const webdavConfig = this.getWebDAVConfig();
    
    if (!webdavConfig.url || !webdavConfig.username || !webdavConfig.password) {
      return {
        success: false,
        message: 'WebDAV配置不完整，请先配置WebDAV服务器信息'
      };
    }

    try {
      const webdavClient = new SmartWebDAVClient(webdavConfig);
      const configData = this.exportConfig();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `paper-config-${timestamp}.json`;
      
      const result = await webdavClient.uploadFile(fileName, configData);
      
      if (result.success) {
        return {
          success: true,
          message: `配置已成功同步到WebDAV服务器`,
          details: `文件名: ${fileName}
文件大小: ${(configData.length / 1024).toFixed(2)} KB
同步时间: ${new Date().toLocaleString()}`
        };
      } else {
        return {
          success: false,
          message: 'WebDAV同步失败',
          details: result.message
        };
      }
    } catch (error) {
      console.error('WebDAV sync error:', error);
      return {
        success: false,
        message: 'WebDAV同步失败',
        details: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 从WebDAV恢复配置
  static async restoreFromWebDAV(): Promise<{ success: boolean; message: string; details?: string; files?: Array<{name: string; size: number; lastModified: Date}> }> {
    const webdavConfig = this.getWebDAVConfig();
    
    if (!webdavConfig.url || !webdavConfig.username || !webdavConfig.password) {
      return {
        success: false,
        message: 'WebDAV配置不完整，请先配置WebDAV服务器信息'
      };
    }

    try {
      const webdavClient = new SmartWebDAVClient(webdavConfig);
      
      // 首先列出可用的配置文件
      const listResult = await webdavClient.listFiles();
      
      if (!listResult.success) {
        return {
          success: false,
          message: '无法获取WebDAV服务器上的文件列表',
          details: listResult.message
        };
      }

      const configFiles = (listResult.files || [])
        .filter((file: WebDAVFile) => file.name.startsWith('paper-config-') && file.name.endsWith('.json'))
        .sort((a: WebDAVFile, b: WebDAVFile) => b.lastModified.getTime() - a.lastModified.getTime()); // 按时间倒序排列

      if (configFiles.length === 0) {
        return {
          success: false,
          message: '在WebDAV服务器上没有找到配置备份文件',
          details: '请先使用"同步到云端"功能创建配置备份'
        };
      }

      // 下载最新的配置文件
      const latestFile = configFiles[0];
      const downloadResult = await webdavClient.downloadFile(latestFile.name);
      
      if (!downloadResult.success || !downloadResult.content) {
        return {
          success: false,
          message: '下载配置文件失败',
          details: downloadResult.message
        };
      }

      // 导入配置
      const importResult = this.importConfig(downloadResult.content);
      
      if (importResult.success) {
        return {
          success: true,
          message: '配置已成功从WebDAV服务器恢复',
          details: `恢复的文件: ${latestFile.name}
文件大小: ${(latestFile.size / 1024).toFixed(2)} KB
备份时间: ${latestFile.lastModified.toLocaleString()}
${importResult.details || ''}`,
          files: configFiles.map((file: WebDAVFile) => ({
            name: file.name,
            size: file.size,
            lastModified: file.lastModified
          }))
        };
      } else {
        const detailsText = importResult.details ? importResult.message + '' + importResult.details : importResult.message;
        return {
          success: false,
          message: '配置文件下载成功但导入失败',
          details: detailsText
        };
      }
    } catch (error) {
      console.error('WebDAV restore error:', error);
      return {
        success: false,
        message: 'WebDAV恢复失败',
        details: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 列出WebDAV服务器上的配置备份文件
  static async listWebDAVBackups(): Promise<{ success: boolean; message: string; files?: Array<{name: string; size: number; lastModified: Date}> }> {
    const webdavConfig = this.getWebDAVConfig();
    
    if (!webdavConfig.url || !webdavConfig.username || !webdavConfig.password) {
      return {
        success: false,
        message: 'WebDAV配置不完整，请先配置WebDAV服务器信息'
      };
    }

    try {
      const webdavClient = new SmartWebDAVClient(webdavConfig);
      const listResult = await webdavClient.listFiles();
      
      if (!listResult.success) {
        return {
          success: false,
          message: '无法获取WebDAV服务器上的文件列表',
          files: []
        };
      }

      const configFiles = (listResult.files || [])
        .filter((file: WebDAVFile) => file.name.startsWith('paper-config-') && file.name.endsWith('.json'))
        .sort((a: WebDAVFile, b: WebDAVFile) => b.lastModified.getTime() - a.lastModified.getTime())
        .map((file: WebDAVFile) => ({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified
        }));

      return {
        success: true,
        message: `找到 ${configFiles.length} 个配置备份文件`,
        files: configFiles
      };
    } catch (error) {
      console.error('WebDAV list backups error:', error);
      return {
        success: false,
        message: '获取备份文件列表失败: ' + (error instanceof Error ? error.message : '未知错误'),
        files: []
      };
    }
  }

  // 测试WebDAV连接
  static async testWebDAVConnection(): Promise<{ success: boolean; message: string; details?: string; isWarning?: boolean }> {
    const webdavConfig = this.getWebDAVConfig();
    
    if (!webdavConfig.url || !webdavConfig.username || !webdavConfig.password) {
      return {
        success: false,
        message: '请填写完整的WebDAV配置信息',
        details: 'URL、用户名和密码都是必填项'
      };
    }

    try {
      const webdavClient = new SmartWebDAVClient(webdavConfig);
      const result = await webdavClient.testConnection();
      
      return result;
    } catch (error) {
      console.error('WebDAV connection test error:', error);
      
      if (error instanceof Error && (error.message.includes('CORS') || error.message.includes('Access to fetch'))) {
        return {
          success: false,
          message: 'CORS策略限制 (这是正常现象)',
          details: `浏览器的CORS安全策略阻止了对WebDAV服务器的直接访问。

这在大多数WebDAV服务（包括坚果云）中都是正常现象，因为：
• WebDAV服务器通常不允许网页直接跨域访问
• 这是为了安全考虑的标准配置

重要提示：
✓ 即使测试失败，您的WebDAV配置可能仍然有效
✓ 实际的文件同步功能可能正常工作
✓ 建议保存配置并尝试实际使用功能

如果您确认配置信息正确（URL、用户名、应用密码），可以忽略此测试结果。`,
          isWarning: true
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