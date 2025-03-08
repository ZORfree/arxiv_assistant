'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { UserPreference } from '@/lib/ai';
import PreferenceForm from './PreferenceForm';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

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
    }
  });
  
  // 添加表单验证状态
  const [errors, setErrors] = useState({
    apiKey: false,
    apiBaseUrl: false,
    model: false
  });
  
  // 检查API配置是否有效
  const isApiConfigValid = () => {
    return !!preferences.apiConfig?.apiKey && 
           !!preferences.apiConfig?.apiBaseUrl && 
           !!preferences.apiConfig?.model;
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
                      API配置
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