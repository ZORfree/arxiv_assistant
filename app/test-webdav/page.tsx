'use client';

import { useState } from 'react';
import { SmartWebDAVClient } from '../../lib/webdav-smart';
import { ConfigService } from '../../lib/config';

export default function TestWebDAV() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('正在测试连接...');
    
    try {
      const config = ConfigService.getWebDAVConfig();
      
      if (!config.url || !config.username || !config.password) {
        setResult('请先在设置页面配置WebDAV信息');
        setLoading(false);
        return;
      }

      const client = new SmartWebDAVClient(config);
      const testResult = await client.testConnection();
      
      setResult(JSON.stringify(testResult, null, 2));
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    setLoading(true);
    setResult('正在测试上传...');
    
    try {
      const config = ConfigService.getWebDAVConfig();
      
      if (!config.url || !config.username || !config.password) {
        setResult('请先在设置页面配置WebDAV信息');
        setLoading(false);
        return;
      }

      const client = new SmartWebDAVClient(config);
      const testData = JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        message: 'WebDAV代理测试文件'
      }, null, 2);
      
      const uploadResult = await client.uploadFile('test-proxy.json', testData);
      setResult(JSON.stringify(uploadResult, null, 2));
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const testList = async () => {
    setLoading(true);
    setResult('正在获取文件列表...');
    
    try {
      const config = ConfigService.getWebDAVConfig();
      
      if (!config.url || !config.username || !config.password) {
        setResult('请先在设置页面配置WebDAV信息');
        setLoading(false);
        return;
      }

      const client = new SmartWebDAVClient(config);
      const listResult = await client.listFiles();
      setResult(JSON.stringify(listResult, null, 2));
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const detectBestMode = async () => {
    setLoading(true);
    setResult('正在检测最佳连接方式...');
    
    try {
      const config = ConfigService.getWebDAVConfig();
      
      if (!config.url || !config.username || !config.password) {
        setResult('请先在设置页面配置WebDAV信息');
        setLoading(false);
        return;
      }

      const client = new SmartWebDAVClient(config);
      const detectResult = await client.detectBestConnectionMode();
      
      const displayResult = {
        ...detectResult,
        currentMode: config.useProxy !== false ? 'proxy' : 'direct',
        currentModeText: config.useProxy !== false ? '服务器代理模式' : '直连模式'
      };
      
      setResult(JSON.stringify(displayResult, null, 2));
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">WebDAV代理测试</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? '测试中...' : '测试连接'}
        </button>
        
        <button
          onClick={testUpload}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-2"
        >
          {loading ? '上传中...' : '测试上传'}
        </button>
        
        <button
          onClick={testList}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-2"
        >
          {loading ? '获取中...' : '获取文件列表'}
        </button>
        
        <button
          onClick={detectBestMode}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-2"
        >
          {loading ? '检测中...' : '智能检测'}
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">测试结果:</h2>
        <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
          {result || '点击上方按钮开始测试'}
        </pre>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800">功能说明:</h3>
        <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
          <li><strong>测试连接</strong>：测试当前配置的连接方式是否正常</li>
          <li><strong>测试上传</strong>：上传一个测试文件验证写入功能</li>
          <li><strong>获取文件列表</strong>：列出WebDAV服务器上的所有文件</li>
          <li><strong>智能检测</strong>：自动测试直连和代理两种模式，推荐最佳选择</li>
        </ul>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800">连接模式说明:</h3>
        <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
          <li><strong>服务器代理模式</strong>：通过应用服务器转发请求，可解决CORS问题（推荐）</li>
          <li><strong>直连模式</strong>：直接连接WebDAV服务器，性能更好但可能遇到CORS限制</li>
          <li>可在设置页面切换连接模式，或使用智能检测自动选择</li>
        </ul>
      </div>
    </div>
  );
}