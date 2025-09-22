'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { UserPreference } from '@/lib/ai';
import PreferenceForm from './PreferenceForm';
import { ExclamationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface SettingsProps {
  onSave: (preferences: UserPreference) => void;
  initialPreferences?: UserPreference;
  onClose: () => void;
}

export default function Settings({ onSave, initialPreferences, onClose }: SettingsProps) {
  const [preferences, setPreferences] = useState<UserPreference>(() => initialPreferences || {
    profession: '',
    interests: [],
    nonInterests: [],
    apiConfig: {
      apiKey: '',
      apiBaseUrl: '',
      model: '',
      maxConcurrentRequests: 3
    },
    arxivProxyUrl: '' // 新增：ArXiv代理URL配置
  });
  
  // 添加表单验证状态
  const [errors, setErrors] = useState({
    apiKey: false,
    apiBaseUrl: false,
    model: false
  });
  
  // 添加API测试状态
  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // 添加WebDAV配置状态
  const [webdavConfig, setWebdavConfig] = useState({
    url: '',
    username: '',
    password: ''
  });

  // 添加WebDAV测试状态
  const [testingWebdav, setTestingWebdav] = useState(false);
  const [webdavTestResult, setWebdavTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  
  // 检查API配置是否有效
  const isApiConfigValid = () => {
    return !!preferences.apiConfig?.apiKey && 
           !!preferences.apiConfig?.apiBaseUrl && 
           !!preferences.apiConfig?.model;
  };

  // WebDAV连通性测试函数
  const testWebdavConnection = async () => {
    if (!webdavConfig.url || !webdavConfig.username || !webdavConfig.password) {
      setWebdavTestResult({
        success: false,
        message: '请填写完整的WebDAV配置信息',
        details: 'URL、用户名和密码都是必填项'
      });
      return;
    }

    setTestingWebdav(true);
    setWebdavTestResult(null);

    try {
      // 创建基本认证头
      const auth = btoa(`${webdavConfig.username}:${webdavConfig.password}`);
      
      // 测试WebDAV连接（使用PROPFIND方法）
      const response = await fetch(webdavConfig.url, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Depth': '0',
          'Content-Type': 'application/xml'
        },
        body: '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop><displayname/></prop></propfind>'
      });

      if (response.ok || response.status === 207) { // 207 Multi-Status is also success for WebDAV
        setWebdavTestResult({
          success: true,
          message: 'WebDAV连接测试成功！',
          details: `服务器响应状态: ${response.status} ${response.statusText}`
        });
      } else {
        setWebdavTestResult({
          success: false,
          message: 'WebDAV连接失败',
          details: `服务器响应: ${response.status} ${response.statusText}`
        });
      }
    } catch (error) {
      setWebdavTestResult({
        success: false,
        message: 'WebDAV连接测试失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setTestingWebdav(false);
    }
  };

  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('user_preferences');
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences(prev => ({
          ...prev,
          ...parsedPreferences
        }));
      }
    } catch (error) {
      console.error('Error loading preferences from localStorage:', error);
    }
  }, []);

  const handleSave = () => {
    // 验证API配置必填项
    const newErrors = {
      apiKey: !preferences.apiConfig?.apiKey,
      apiBaseUrl: !preferences.apiConfig?.apiBaseUrl,
      model: !preferences.apiConfig?.model
    };
    
    setErrors(newErrors);
    
    // 如果有错误，不执行保存
    if (newErrors.apiKey || newErrors.apiBaseUrl || newErrors.model) {
      return;
    }
    
    try {
      localStorage.setItem('user_preferences', JSON.stringify(preferences));
      onSave(preferences);
      onClose();
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4"
                >
                  设置
                </Dialog.Title>

                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 dark:bg-blue-900/30 p-1 mb-4">
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 dark:text-blue-200
                        ${selected
                          ? 'bg-white dark:bg-gray-700 shadow'
                          : 'text-blue-100 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-100'
                        }`
                      }
                    >
                      研究偏好
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 dark:text-blue-200
                        ${selected
                          ? 'bg-white dark:bg-gray-700 shadow'
                          : 'text-blue-100 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-100'
                        }`
                      }
                    >
                      LLM设置
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 dark:text-blue-200
                        ${selected
                          ? 'bg-white dark:bg-gray-700 shadow'
                          : 'text-blue-100 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-100'
                        }`
                      }
                    >
                      网络设置
                    </Tab>
                  </Tab.List>
                  <Tab.Panels>
                    <Tab.Panel>
                      <PreferenceForm
                        onSave={(newPreferences) => {
                          const updatedPreferences = {
                            ...preferences,
                            ...newPreferences
                          };
                          setPreferences(updatedPreferences);
                          // 移除这里的handleSave()调用，让用户可以通过底部的保存按钮统一保存所有设置
                        }}
                        initialPreferences={preferences}
                      />
                    </Tab.Panel>
                    <Tab.Panel>
                      <div className="space-y-6 max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow">
                        <div>
                          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            API密钥
                          </label>
                          <div className="relative mt-1">
                            <input
                              type="password"
                              id="apiKey"
                              value={preferences.apiConfig?.apiKey || ''}
                              onChange={(e) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  apiConfig: {
                                    ...prev.apiConfig!,
                                    apiKey: e.target.value || ''
                                  }
                                } as UserPreference));
                                setErrors(prev => ({ ...prev, apiKey: !e.target.value }));
                              }}
                              className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${errors.apiKey ? 'border-red-300 pr-10 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-400 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                              required
                            />
                            {errors.apiKey && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                              </div>
                            )}
                          </div>
                          {errors.apiKey && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="apiKey-error">
                              API密钥不能为空
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="apiBaseUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            API基础URL
                          </label>
                          <div className="relative mt-1">
                            <input
                              type="text"
                              id="apiBaseUrl"
                              value={preferences.apiConfig?.apiBaseUrl || ''}
                              onChange={(e) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  apiConfig: {
                                    ...prev.apiConfig!,
                                    apiBaseUrl: e.target.value || ''
                                  }
                                } as UserPreference));
                                setErrors(prev => ({ ...prev, apiBaseUrl: !e.target.value }));
                              }}
                              className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${errors.apiBaseUrl ? 'border-red-300 pr-10 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-400 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                              required
                            />
                            {errors.apiBaseUrl && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                              </div>
                            )}
                          </div>
                          {errors.apiBaseUrl && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="apiBaseUrl-error">
                              API基础URL不能为空
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            模型名称
                          </label>
                          <div className="relative mt-1">
                            <input
                              type="text"
                              id="model"
                              value={preferences.apiConfig?.model || ''}
                              onChange={(e) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  apiConfig: {
                                    ...prev.apiConfig!,
                                    model: e.target.value || ''
                                  }
                                } as UserPreference));
                                setErrors(prev => ({ ...prev, model: !e.target.value }));
                              }}
                              className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${errors.model ? 'border-red-300 pr-10 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-400 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                              required
                            />
                            {errors.model && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                              </div>
                            )}
                          </div>
                          {errors.model && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="model-error">
                              模型名称不能为空
                            </p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="maxConcurrentRequests" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            最大并发请求数
                          </label>
                          <input
                            type="number"
                            id="maxConcurrentRequests"
                            value={preferences.apiConfig?.maxConcurrentRequests || 3}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              apiConfig: {
                                ...prev.apiConfig!,
                                maxConcurrentRequests: parseInt(e.target.value) || 3
                              }
                            } as UserPreference))}
                            min="1"
                            max="10"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            required
                          />
                        </div>
                        
                        {/* API测试按钮 */}
                        <div className="mt-6">
                          <button
                            type="button"
                            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 ${isApiConfigValid() ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600' : 'bg-green-400 dark:bg-green-400 cursor-not-allowed'}`}
                            onClick={async () => {
                              if (!isApiConfigValid()) return;
                              
                              setTestingApi(true);
                              setTestResult(null);
                              
                              try {
                                const response = await axios.post('/api/test', {
                                  apiKey: preferences.apiConfig?.apiKey,
                                  apiBaseUrl: preferences.apiConfig?.apiBaseUrl,
                                  model: preferences.apiConfig?.model
                                });
                                
                                setTestResult({
                                  success: response.data.success,
                                  message: response.data.message
                                });
                              } catch (error) {
                                // 将错误转换为AxiosError类型
                                const axiosError = error as import('axios').AxiosError<{
                                  message?: string;
                                  details?: string;
                                  error?: string;
                                }>;
                                // 获取详细的错误信息
                                const errorMessage = axiosError.response?.data?.message || '测试失败，请检查API配置';
                                const errorDetails = axiosError.response?.data?.details || axiosError.response?.data?.error || '';
                                
                                setTestResult({
                                  success: false,
                                  message: errorMessage,
                                  details: errorDetails
                                });
                              } finally {
                                setTestingApi(false);
                              }
                            }}
                            disabled={!isApiConfigValid() || testingApi}
                          >
                            {testingApi ? '测试中...' : '测试API连接'}
                          </button>
                          
                          {testResult && (
                            <div className={`mt-3 ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              <div className="flex items-center">
                                {testResult.success ? (
                                  <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                                ) : (
                                  <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium">{testResult.message}</span>
                              </div>
                              
                              {/* 显示详细错误信息 */}
                              {!testResult.success && testResult.details && (
                                <div className="mt-2 ml-7 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800 whitespace-pre-wrap break-words">
                                  {testResult.details}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Tab.Panel>
                    <Tab.Panel>
                      <div className="space-y-6 max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow">
                        {/* ArXiv代理URL配置 */}
                        <div>
                          <label htmlFor="arxivProxyUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            ArXiv代理URL
                          </label>
                          <input
                            type="text"
                            id="arxivProxyUrl"
                            value={preferences.arxivProxyUrl || ''}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              arxivProxyUrl: e.target.value
                            }))}
                            placeholder="例如：http://proxy.example.com/"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                          />
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            可选项。如果ArXiv在您的地区访问不稳定，可以配置代理URL。留空则直接访问ArXiv官方API。
                          </p>
                        </div>

                        {/* 分隔线 */}
                        <div className="border-t border-gray-200 dark:border-gray-600"></div>

                        {/* WebDAV配置 */}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">WebDAV配置</h4>
                          
                          <div className="space-y-4">
                            {/* WebDAV URL */}
                            <div>
                              <label htmlFor="webdavUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                WebDAV服务器URL
                              </label>
                              <input
                                type="text"
                                id="webdavUrl"
                                value={webdavConfig.url}
                                onChange={(e) => setWebdavConfig(prev => ({ ...prev, url: e.target.value }))}
                                placeholder="https://your-webdav-server.com/dav/"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                              />
                            </div>

                            {/* WebDAV用户名 */}
                            <div>
                              <label htmlFor="webdavUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                用户名
                              </label>
                              <input
                                type="text"
                                id="webdavUsername"
                                value={webdavConfig.username}
                                onChange={(e) => setWebdavConfig(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="输入WebDAV用户名"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                              />
                            </div>

                            {/* WebDAV密码 */}
                            <div>
                              <label htmlFor="webdavPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                密码
                              </label>
                              <input
                                type="password"
                                id="webdavPassword"
                                value={webdavConfig.password}
                                onChange={(e) => setWebdavConfig(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="输入WebDAV密码"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                              />
                            </div>

                            {/* 测试连接按钮 */}
                            <div className="flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={testWebdavConnection}
                                disabled={testingWebdav || !webdavConfig.url || !webdavConfig.username || !webdavConfig.password}
                                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 ${
                                  testingWebdav || !webdavConfig.url || !webdavConfig.username || !webdavConfig.password
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                                }`}
                              >
                                {testingWebdav ? '测试中...' : '测试连接'}
                              </button>
                            </div>

                            {/* 测试结果显示 */}
                            {webdavTestResult && (
                              <div className={`p-4 rounded-md ${
                                webdavTestResult.success 
                                  ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                  : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
                              }`}>
                                <div className="flex items-start">
                                  <div className="flex-shrink-0">
                                    {webdavTestResult.success ? (
                                      <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                                    ) : (
                                      <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    <h3 className={`text-sm font-medium ${
                                      webdavTestResult.success 
                                        ? 'text-green-800 dark:text-green-200' 
                                        : 'text-red-800 dark:text-red-200'
                                    }`}>
                                      {webdavTestResult.message}
                                    </h3>
                                    {webdavTestResult.details && (
                                      <div className={`mt-2 text-sm ${
                                        webdavTestResult.success 
                                          ? 'text-green-700 dark:text-green-300' 
                                          : 'text-red-700 dark:text-red-300'
                                      }`}>
                                        {webdavTestResult.details}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              WebDAV用于同步和备份论文收藏数据。支持大多数WebDAV服务，如Nextcloud、ownCloud等。
                            </p>
                          </div>
                        </div>
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-900"
                    onClick={onClose}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 ${isApiConfigValid() ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600' : 'bg-indigo-400 dark:bg-indigo-400 cursor-not-allowed'}`}
                    onClick={handleSave}
                    disabled={!isApiConfigValid()}
                  >
                    保存
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}