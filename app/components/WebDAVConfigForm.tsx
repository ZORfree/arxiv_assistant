'use client';

import { useState, useEffect } from 'react';
import { ConfigService, WebDAVConfig } from '../../lib/config';
import { SmartWebDAVClient } from '../../lib/webdav-smart';

interface WebDAVConfigFormProps {
  onConfigChange?: (config: WebDAVConfig) => void;
}

export default function WebDAVConfigForm({ onConfigChange }: WebDAVConfigFormProps) {
  const [config, setConfig] = useState<WebDAVConfig>({
    url: '',
    username: '',
    password: '',
    useProxy: true
  });
  const [testing, setTesting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedConfig = ConfigService.getWebDAVConfig();
    setConfig(savedConfig);
  }, []);

  const handleConfigChange = (field: keyof WebDAVConfig, value: string | boolean) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    ConfigService.saveWebDAVConfig(newConfig);
    
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const testConnection = async () => {
    if (!config.url || !config.username || !config.password) {
      setTestResult('请填写完整的WebDAV配置信息');
      return;
    }

    setTesting(true);
    setTestResult('正在测试连接...');

    try {
      const client = new SmartWebDAVClient(config);
      const result = await client.testConnection();
      
      const connectionType = client.getConnectionType();
      const modeText = connectionType === 'direct' ? '直连模式' : '服务器代理模式';
      
      if (result.success) {
        setTestResult(`✅ 连接测试成功！(${modeText})\n\n${result.details || result.message}`);
      } else {
        const warningIcon = result.isWarning ? '⚠️' : '❌';
        setTestResult(`${warningIcon} ${result.message}\n\n${result.details || ''}`);
      }
    } catch (error) {
      setTestResult(`❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setTesting(false);
    }
  };

  const detectBestMode = async () => {
    if (!config.url || !config.username || !config.password) {
      setTestResult('请填写完整的WebDAV配置信息');
      return;
    }

    setDetecting(true);
    setTestResult('正在检测最佳连接方式...');

    try {
      const client = new SmartWebDAVClient(config);
      const result = await client.detectBestConnectionMode();
      
      let resultText = `🔍 连接方式检测结果:\n\n`;
      
      if (result.directResult) {
        const directIcon = result.directResult.success ? '✅' : '❌';
        resultText += `${directIcon} 直连模式: ${result.directResult.success ? '成功' : '失败'}\n`;
      }
      
      if (result.proxyResult) {
        const proxyIcon = result.proxyResult.success ? '✅' : '❌';
        resultText += `${proxyIcon} 代理模式: ${result.proxyResult.success ? '成功' : '失败'}\n\n`;
      }
      
      resultText += `💡 建议: ${result.recommendation}\n\n`;
      
      if (result.success && result.recommendedMode !== (config.useProxy ? 'proxy' : 'direct')) {
        const shouldUseProxy = result.recommendedMode === 'proxy';
        if (config.useProxy !== shouldUseProxy) {
          handleConfigChange('useProxy', shouldUseProxy);
          resultText += `✅ 已自动切换到${result.recommendedMode === 'direct' ? '直连' : '代理'}模式`;
        }
      }
      
      setTestResult(resultText);
    } catch (error) {
      setTestResult(`❌ 检测失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">WebDAV 配置</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              WebDAV服务器地址
            </label>
            <input
              type="url"
              value={config.url}
              onChange={(e) => handleConfigChange('url', e.target.value)}
              placeholder="https://dav.jianguoyun.com/dav/"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              例如：坚果云 https://dav.jianguoyun.com/dav/
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              用户名
            </label>
            <input
              type="text"
              value={config.username}
              onChange={(e) => handleConfigChange('username', e.target.value)}
              placeholder="your-email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              密码/应用密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={config.password}
                onChange={(e) => handleConfigChange('password', e.target.value)}
                placeholder="应用密码（不是登录密码）"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              注意：通常需要使用应用密码，而不是账户登录密码
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.useProxy !== false}
                onChange={(e) => handleConfigChange('useProxy', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">使用服务器代理</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              {config.useProxy !== false 
                ? '✅ 通过服务器代理连接，可解决CORS问题（推荐）' 
                : '⚠️ 直连WebDAV服务器，可能遇到CORS限制'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={testConnection}
          disabled={testing || detecting}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {testing ? '测试中...' : '测试连接'}
        </button>
        
        <button
          onClick={detectBestMode}
          disabled={testing || detecting}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {detecting ? '检测中...' : '智能检测'}
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-semibold mb-2">测试结果:</h4>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">
            {testResult}
          </pre>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="font-semibold text-blue-800 mb-2">使用说明:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>服务器代理模式</strong>：通过应用服务器转发请求，可解决CORS问题（推荐）</li>
          <li>• <strong>直连模式</strong>：直接连接WebDAV服务器，性能更好但可能遇到CORS限制</li>
          <li>• <strong>智能检测</strong>：自动测试两种模式并推荐最佳选择</li>
          <li>• 坚果云等服务通常需要使用应用密码，不是登录密码</li>
        </ul>
      </div>
    </div>
  );
}