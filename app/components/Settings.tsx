'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { UserPreference } from '@/lib/ai';
import PreferenceForm from './PreferenceForm';

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

  useEffect(() => {
    try {
      const savedApiConfig = localStorage.getItem('api_config');
      if (savedApiConfig) {
        const parsedApiConfig = JSON.parse(savedApiConfig);
        setPreferences(prev => ({
          ...prev,
          apiConfig: parsedApiConfig
        }));
      }
    } catch (error) {
      console.error('Error loading API config from localStorage:', error);
    }
  }, []);

  const handleSave = () => {
    if (preferences.apiConfig) {
      localStorage.setItem('api_config', JSON.stringify(preferences.apiConfig));
    }
    onSave(preferences);
    onClose();
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4"
                >
                  设置
                </Dialog.Title>

                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-4">
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
                          handleSave();
                        }}
                        initialPreferences={preferences}
                      />
                    </Tab.Panel>
                    <Tab.Panel>
                      <div className="space-y-6 max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div>
                          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            API密钥
                          </label>
                          <input
                            type="password"
                            id="apiKey"
                            value={preferences.apiConfig?.apiKey || ''}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              apiConfig: {
                                ...prev.apiConfig!,
                                apiKey: e.target.value || ''
                              }
                            } as UserPreference))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="apiBaseUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            API基础URL
                          </label>
                          <input
                            type="text"
                            id="apiBaseUrl"
                            value={preferences.apiConfig?.apiBaseUrl || ''}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              apiConfig: {
                                ...prev.apiConfig!,
                                apiBaseUrl: e.target.value || ''
                              }
                            } as UserPreference))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                            模型名称
                          </label>
                          <input
                            type="text"
                            id="model"
                            value={preferences.apiConfig?.model || ''}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              apiConfig: {
                                ...prev.apiConfig!,
                                model: e.target.value || ''
                              }
                            } as UserPreference))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                            required
                          />
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
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
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                    onClick={onClose}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={handleSave}
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