'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { UserPreference } from '@/lib/ai';
import PreferenceForm from './PreferenceForm';
import { ExclamationCircleIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { ConfigService, WebDAVConfig } from '@/lib/config';

interface SettingsProps {
  onSave: (preferences: UserPreference) => void;
  initialPreferences?: UserPreference;
  onClose: () => void;
}

export default function Settings({ onSave, initialPreferences, onClose }: SettingsProps): React.ReactElement {
  const [preferences, setPreferences] = useState<UserPreference>(() => initialPreferences || {
    profession: '',
    interests: [],
    nonInterests: [],
    apiConfig: {
      apiKey: '',
      apiBaseUrl: '',
      model: '',
      maxConcurrentRequests: 3,
      useProxy: false // 默认不使用代理（直连）
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
  const [webdavConfig, setWebdavConfig] = useState<WebDAVConfig>(() => ConfigService.getWebDAVConfig());

  // 添加WebDAV测试状态
  const [testingWebdav, setTestingWebdav] = useState(false);
  const [webdavTestResult, setWebdavTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
    isWarning?: boolean;
  } | null>(null);

  // 添加配置导入导出状态
  const [importExportResult, setImportExportResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);
  
  // 添加WebDAV恢复状态
  const [restoringFromWebDAV, setRestoringFromWebDAV] = useState(false);
  
  // 检查API配置是否有效
  const isApiConfigValid = () => {
    return !!preferences.apiConfig?.apiKey && 
           !!preferences.apiConfig?.apiBaseUrl && 
           !!preferences.apiConfig?.model;
  };

  // WebDAV连通性测试函数
  const testWebdavConnection = async () => {
    setTestingWebdav(true);
    setWebdavTestResult(null);

    try {
      // 使用当前界面上的配置进行测试，而不是已保存的配置
      const { SmartWebDAVClient } = await import('@/lib/webdav-smart');
      const client = new SmartWebDAVClient(webdavConfig);
      const result = await client.testConnection();
      
      const connectionType = client.getConnectionType();
      const modeText = connectionType === 'direct' ? '直连模式' : '服务器代理模式';
      
      if (result.success) {
        setWebdavTestResult({
          ...result,
          message: `✅ 连接测试成功！(${modeText})`,
          details: result.details || result.message
        });
      } else {
        setWebdavTestResult({
          ...result,
          message: `${result.isWarning ? '⚠️' : '❌'} ${result.message} (${modeText})`,
          details: result.details
        });
      }
    } catch (error) {
      setWebdavTestResult({
        success: false,
        message: '连接测试失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setTestingWebdav(false);
    }
  };

  useEffect(() => {
    try {
      const savedPreferences = ConfigService.getUserPreferences();
      setPreferences(prev => ({
        ...prev,
        ...savedPreferences
      }));
      
      const savedWebdavConfig = ConfigService.getWebDAVConfig();
      setWebdavConfig(savedWebdavConfig);
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
      ConfigService.saveUserPreferences(preferences);
      ConfigService.saveWebDAVConfig(webdavConfig);
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
                    <Tab
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 dark:text-blue-200
                        ${selected
                          ? 'bg-white dark:bg-gray-700 shadow'
                          : 'text-blue-100 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-100'
                        }`
                      }
                    >
                      数据管理
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

                        {/* 使用服务器代理选项 */}
                        <div>
                          <div className="flex items-center">
                            <input
                              id="llmUseProxy"
                              type="checkbox"
                              checked={preferences.apiConfig?.useProxy === true}
                              onChange={(e) => setPreferences(prev => ({
                                ...prev,
                                apiConfig: {
                                  ...prev.apiConfig!,
                                  useProxy: e.target.checked
                                }
                              } as UserPreference))}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                            />
                            <label htmlFor="llmUseProxy" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                              使用服务器代理
                            </label>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {preferences.apiConfig?.useProxy === true
                              ? '✅ 通过服务器代理连接LLM服务，可解决CORS跨域问题和网络限制' 
                              : '⚠️ 直连LLM服务器，性能更好但可能遇到网络限制或CORS问题'}
                          </p>
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
                                if (preferences.apiConfig?.useProxy === true) {
                                  // 代理模式：通过服务器API测试
                                  const response = await axios.post('/api/test', {
                                    apiKey: preferences.apiConfig?.apiKey,
                                    apiBaseUrl: preferences.apiConfig?.apiBaseUrl,
                                    model: preferences.apiConfig?.model,
                                    useProxy: preferences.apiConfig?.useProxy
                                  });
                                  
                                  setTestResult({
                                    success: response.data.success,
                                    message: response.data.message
                                  });
                                } else {
                                  // 直连模式：前端直接测试
                                  const apiUrl = `${preferences.apiConfig?.apiBaseUrl}/chat/completions`;
                                  await axios.post(apiUrl, {
                                    model: preferences.apiConfig?.model,
                                    messages: [
                                      {
                                        role: 'user',
                                        content: 'hi'
                                      }
                                    ],
                                    temperature: 0.7
                                  }, {
                                    headers: {
                                      'Authorization': `Bearer ${preferences.apiConfig?.apiKey}`,
                                      'Content-Type': 'application/json'
                                    }
                                  });
                                  
                                  setTestResult({
                                    success: true,
                                    message: 'API连接测试成功（直连模式）'
                                  });
                                }
                              } catch (error) {
                                // 将错误转换为AxiosError类型
                                const axiosError = error as import('axios').AxiosError<{
                                  message?: string;
                                  details?: string;
                                  error?: string;
                                }>;
                                
                                let errorMessage = '测试失败，请检查API配置';
                                let errorDetails = '';
                                
                                if (preferences.apiConfig?.useProxy !== true) {
                                  // 直连模式的错误处理
                                  if (axiosError.response) {
                                    errorMessage = `API返回错误: ${axiosError.response.status} ${axiosError.response.statusText}`;
                                    if (axiosError.response.data?.error) {
                                      const errorData = axiosError.response.data.error;
                                      if (typeof errorData === 'string') {
                                        errorDetails = errorData;
                                      } else if (typeof errorData === 'object' && errorData !== null && 'message' in errorData) {
                                        errorDetails = (errorData as { message: string }).message;
                                      } else {
                                        errorDetails = JSON.stringify(errorData);
                                      }
                                    }
                                  } else if (axiosError.request) {
                                    errorMessage = '无法连接到API服务器';
                                    errorDetails = '请检查API基础URL和网络连接，或尝试启用服务器代理模式';
                                  } else {
                                    errorMessage = axiosError.message || '未知错误';
                                  }
                                } else {
                                  // 代理模式的错误处理
                                  errorMessage = axiosError.response?.data?.message || '测试失败，请检查API配置';
                                  errorDetails = axiosError.response?.data?.details || axiosError.response?.data?.error || '';
                                }
                                
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
                                placeholder="https://dav.jianguoyun.com/dav/ (坚果云) 或其他WebDAV服务器"
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
                                placeholder="坚果云：邮箱地址 | 其他服务：用户名"
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
                                placeholder="坚果云：应用密码 | 其他服务：登录密码"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                              />
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                坚果云用户请在网页版&ldquo;账户信息-安全选项&rdquo;中生成应用密码，不能使用登录密码
                              </p>
                            </div>

                            {/* 使用服务器代理选项 */}
                            <div>
                              <div className="flex items-center">
                                <input
                                  id="useProxy"
                                  type="checkbox"
                                  checked={webdavConfig.useProxy !== false}
                                  onChange={(e) => setWebdavConfig(prev => ({ ...prev, useProxy: e.target.checked }))}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                                />
                                <label htmlFor="useProxy" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                  使用服务器代理
                                </label>
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {webdavConfig.useProxy !== false 
                                  ? '✅ 通过服务器代理连接WebDAV，可解决CORS跨域问题（推荐）' 
                                  : '⚠️ 直连WebDAV服务器，性能更好但可能遇到CORS限制'}
                              </p>
                            </div>

                            {/* 测试连接和智能检测按钮 */}
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
                              
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!webdavConfig.url || !webdavConfig.username || !webdavConfig.password) {
                                    setWebdavTestResult({
                                      success: false,
                                      message: '请填写完整的WebDAV配置信息'
                                    });
                                    return;
                                  }

                                  setTestingWebdav(true);
                                  setWebdavTestResult({
                                    success: false,
                                    message: '正在智能检测最佳连接方式...'
                                  });

                                  try {
                                    // 导入SmartWebDAVClient
                                    const { SmartWebDAVClient } = await import('@/lib/webdav-smart');
                                    const client = new SmartWebDAVClient(webdavConfig);
                                    const result = await client.detectBestConnectionMode();
                                    
                                    let resultMessage = `🔍 智能检测完成

`;
                                    
                                    if (result.directResult) {
                                      const directIcon = result.directResult.success ? '✅' : '❌';
                                      resultMessage += `${directIcon} 直连模式: ${result.directResult.success ? '成功' : '失败'}
`;
                                    }
                                    
                                    if (result.proxyResult) {
                                      const proxyIcon = result.proxyResult.success ? '✅' : '❌';
                                      resultMessage += `${proxyIcon} 代理模式: ${result.proxyResult.success ? '成功' : '失败'}

`;
                                    }
                                    
                                    resultMessage += `💡 推荐: ${result.recommendation}`;
                                    
                                    // 如果推荐的模式与当前设置不同，自动应用推荐设置
                                    if (result.success && result.recommendedMode !== (webdavConfig.useProxy ? 'proxy' : 'direct')) {
                                      const shouldUseProxy = result.recommendedMode === 'proxy';
                                      setWebdavConfig(prev => ({ ...prev, useProxy: shouldUseProxy }));
                                      resultMessage += `

✅ 已自动切换到${result.recommendedMode === 'direct' ? '直连' : '代理'}模式`;
                                    }
                                    
                                    setWebdavTestResult({
                                      success: result.success,
                                      message: result.success ? '智能检测成功' : '智能检测完成',
                                      details: resultMessage,
                                      isWarning: !result.success
                                    });
                                  } catch (error) {
                                    setWebdavTestResult({
                                      success: false,
                                      message: '智能检测失败',
                                      details: error instanceof Error ? error.message : '未知错误'
                                    });
                                  } finally {
                                    setTestingWebdav(false);
                                  }
                                }}
                                disabled={testingWebdav || !webdavConfig.url || !webdavConfig.username || !webdavConfig.password}
                                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 ${
                                  testingWebdav || !webdavConfig.url || !webdavConfig.username || !webdavConfig.password
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                    : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                                }`}
                              >
                                {testingWebdav ? '检测中...' : '智能检测'}
                              </button>
                            </div>

                            {/* 测试结果显示 */}
                            {webdavTestResult && (
                              <div className={`p-4 rounded-md ${
                                webdavTestResult.success 
                                  ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                  : webdavTestResult.isWarning
                                    ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                                    : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
                              }`}>
                                <div className="flex items-start">
                                  <div className="flex-shrink-0">
                                    {webdavTestResult.success ? (
                                      <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                                    ) : webdavTestResult.isWarning ? (
                                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                    ) : (
                                      <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    <h3 className={`text-sm font-medium ${
                                      webdavTestResult.success 
                                        ? 'text-green-800 dark:text-green-200' 
                                        : webdavTestResult.isWarning
                                          ? 'text-yellow-800 dark:text-yellow-200'
                                          : 'text-red-800 dark:text-red-200'
                                    }`}>
                                      {webdavTestResult.message}
                                    </h3>
                                    {webdavTestResult.details && (
                                      <div className={`mt-2 text-sm whitespace-pre-line ${
                                        webdavTestResult.success 
                                          ? 'text-green-700 dark:text-green-300' 
                                          : webdavTestResult.isWarning
                                            ? 'text-yellow-700 dark:text-yellow-300'
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
                    <Tab.Panel>
                      <div className="space-y-6 max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 dark:border dark:border-gray-700 rounded-lg shadow">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">配置导入导出</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            导出您的所有配置数据（包括研究偏好、LLM设置、网络设置、收藏分类和收藏论文）到文件，或从备份文件恢复配置。
                          </p>
                          
                          {/* 配置统计信息 */}
                          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">当前配置概览</h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">研究偏好:</span>
                                <span className="ml-2 text-gray-900 dark:text-gray-100">
                                  {typeof window !== 'undefined' && ConfigService.getConfigStats().hasPreferences ? '已配置' : '未配置'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">WebDAV:</span>
                                <span className="ml-2 text-gray-900 dark:text-gray-100">
                                  {typeof window !== 'undefined' && ConfigService.getConfigStats().hasWebDAVConfig ? '已配置' : '未配置'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">收藏分类:</span>
                                <span className="ml-2 text-gray-900 dark:text-gray-100">
                                  {typeof window !== 'undefined' ? ConfigService.getConfigStats().favoriteCategoriesCount : 0} 个
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">收藏论文:</span>
                                <span className="ml-2 text-gray-900 dark:text-gray-100">
                                  {typeof window !== 'undefined' ? ConfigService.getConfigStats().favoritePapersCount : 0} 篇
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 导入导出按钮 */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            {/* 导出配置 */}
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const configData = ConfigService.exportConfig();
                                  const blob = new Blob([configData], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `paper-config-${new Date().toISOString().split('T')[0]}.json`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                  
                                  setImportExportResult({
                                    success: true,
                                    message: '配置导出成功',
                                    details: '配置文件已下载到您的设备'
                                  });
                                } catch (error) {
                                  setImportExportResult({
                                    success: false,
                                    message: '配置导出失败',
                                    details: error instanceof Error ? error.message : '未知错误'
                                  });
                                }
                              }}
                              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                              导出配置
                            </button>

                            {/* 导入配置 */}
                            <label className="flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-900 cursor-pointer">
                              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                              导入配置
                              <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      try {
                                        const data = event.target?.result as string;
                                        const result = ConfigService.importConfig(data);
                                        setImportExportResult(result);
                                        
                                        if (result.success) {
                                          // 重新加载配置
                                          const newPreferences = ConfigService.getUserPreferences();
                                          const newWebdavConfig = ConfigService.getWebDAVConfig();
                                          setPreferences(newPreferences);
                                          setWebdavConfig(newWebdavConfig);
                                          
                                          // 通知父组件配置已更新
                                          onSave(newPreferences);
                                        }
                                      } catch (error) {
                                        setImportExportResult({
                                          success: false,
                                          message: '文件读取失败',
                                          details: error instanceof Error ? error.message : '未知错误'
                                        });
                                      }
                                    };
                                    reader.readAsText(file);
                                  }
                                  // 清空input值，允许重复选择同一文件
                                  e.target.value = '';
                                }}
                              />
                            </label>

                            {/* 重置配置 */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('确定要重置所有配置吗？这将清除所有设置、收藏数据等，此操作不可恢复！')) {
                                  try {
                                    ConfigService.resetAllConfig();
                                    
                                    // 重置界面状态
                                    const defaultPreferences: UserPreference = {
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
                                    const defaultWebdavConfig: WebDAVConfig = {
                                      url: '',
                                      username: '',
                                      password: ''
                                    };
                                    
                                    setPreferences(defaultPreferences);
                                    setWebdavConfig(defaultWebdavConfig);
                                    
                                    setImportExportResult({
                                      success: true,
                                      message: '配置重置成功',
                                      details: '所有配置已重置为默认值'
                                    });
                                  } catch (error) {
                                    setImportExportResult({
                                      success: false,
                                      message: '配置重置失败',
                                      details: error instanceof Error ? error.message : '未知错误'
                                    });
                                  }
                                }
                              }}
                              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-gray-700 dark:text-red-400 dark:border-red-400 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-900"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              重置配置
                            </button>
                          </div>

                          {/* 导入导出结果显示 */}
                          {importExportResult && (
                            <div className={`mt-4 p-4 rounded-md ${
                              importExportResult.success 
                                ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
                            }`}>
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  {importExportResult.success ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                                  ) : (
                                    <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                                  )}
                                </div>
                                <div className="ml-3">
                                  <h3 className={`text-sm font-medium ${
                                    importExportResult.success 
                                      ? 'text-green-800 dark:text-green-200' 
                                      : 'text-red-800 dark:text-red-200'
                                  }`}>
                                    {importExportResult.message}
                                  </h3>
                                  {importExportResult.details && (
                                    <div className={`mt-2 text-sm ${
                                      importExportResult.success 
                                        ? 'text-green-700 dark:text-green-300' 
                                        : 'text-red-700 dark:text-red-300'
                                    }`}>
                                      {importExportResult.details}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 分隔线 */}
                          <div className="border-t border-gray-200 dark:border-gray-600 my-6"></div>

                          {/* WebDAV云端同步功能 */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">WebDAV云端同步</h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                              将配置同步到WebDAV服务器，实现跨设备数据同步。需要先在&ldquo;网络设置&rdquo;中配置WebDAV服务器信息。
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={async () => {
                                  const webdavConfig = ConfigService.getWebDAVConfig();
                                  if (!webdavConfig.url || !webdavConfig.username || !webdavConfig.password) {
                                    setImportExportResult({
                                      success: false,
                                      message: 'WebDAV配置不完整',
                                      details: '请先在&ldquo;网络设置&rdquo;标签页中配置WebDAV服务器信息'
                                    });
                                    return;
                                  }

                                  try {
                                    setImportExportResult(null);
                                    const result = await ConfigService.syncToWebDAV();
                                    setImportExportResult(result);
                                  } catch (error) {
                                    setImportExportResult({
                                      success: false,
                                      message: '同步到云端失败',
                                      details: error instanceof Error ? error.message : '未知错误'
                                    });
                                  }
                                }}
                                disabled={!webdavConfig.url}
                                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 ${
                                  webdavConfig.url
                                    ? 'text-white bg-blue-600 border border-transparent hover:bg-blue-700'
                                    : 'text-gray-400 bg-gray-100 border border-gray-300 cursor-not-allowed dark:bg-gray-600 dark:text-gray-500 dark:border-gray-500'
                                }`}
                              >
                                同步到云端
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const webdavConfig = ConfigService.getWebDAVConfig();
                                  if (!webdavConfig.url || !webdavConfig.username || !webdavConfig.password) {
                                    setImportExportResult({
                                      success: false,
                                      message: 'WebDAV配置不完整',
                                      details: '请先在"网络设置"标签页中配置WebDAV服务器信息'
                                    });
                                    return;
                                  }

                                  try {
                                    setRestoringFromWebDAV(true);
                                    setImportExportResult({
                                      success: true,
                                      message: '正在连接WebDAV服务器...',
                                      details: '正在获取备份文件列表'
                                    });
                                    
                                    const result = await ConfigService.restoreFromWebDAV();
                                    
                                    if (result.success) {
                                      setImportExportResult({
                                        success: true,
                                        message: '正在应用配置...',
                                        details: '正在恢复用户偏好、收藏数据等'
                                      });
                                      
                                      // 添加短暂延迟以显示进度
                                      await new Promise(resolve => setTimeout(resolve, 500));
                                      
                                      // 重新加载配置
                                      const newPreferences = ConfigService.getUserPreferences();
                                      const newWebdavConfig = ConfigService.getWebDAVConfig();
                                      setPreferences(newPreferences);
                                      setWebdavConfig(newWebdavConfig);
                                      
                                      // 通知父组件配置已更新
                                      onSave(newPreferences);
                                      
                                      // 显示成功消息
                                      setImportExportResult({
                                        success: true,
                                        message: '✅ 配置恢复成功！',
                                        details: result.details
                                      });
                                    } else {
                                      setImportExportResult(result);
                                    }
                                  } catch (error) {
                                    setImportExportResult({
                                      success: false,
                                      message: '从云端恢复失败',
                                      details: error instanceof Error ? error.message : '未知错误'
                                    });
                                  } finally {
                                    setRestoringFromWebDAV(false);
                                  }
                                }}
                                disabled={!webdavConfig.url || restoringFromWebDAV}
                                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 ${
                                  webdavConfig.url && !restoringFromWebDAV
                                    ? 'text-green-600 bg-white border border-green-600 hover:bg-green-50 dark:bg-gray-700 dark:text-green-400 dark:border-green-400 dark:hover:bg-gray-600'
                                    : 'text-gray-400 bg-gray-100 border border-gray-300 cursor-not-allowed dark:bg-gray-600 dark:text-gray-500 dark:border-gray-500'
                                }`}
                              >
                                {restoringFromWebDAV ? (
                                  <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    恢复中...
                                  </div>
                                ) : (
                                  '从云端恢复'
                                )}
                              </button>
                            </div>
                            
                            {/* WebDAV同步状态提示 */}
                            {!webdavConfig.url && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800">
                                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                  💡 提示：请先在&ldquo;网络设置&rdquo;标签页中配置WebDAV服务器信息，然后即可使用云端同步功能。
                                </p>
                              </div>
                            )}
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