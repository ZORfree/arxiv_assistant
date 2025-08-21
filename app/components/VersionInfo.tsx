'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { VersionInfo } from '@/lib/github';

export default function VersionInfoComponent() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/version');
        
        if (!response.ok) {
          throw new Error('Failed to fetch version information');
        }
        
        const data = await response.json();
        setVersionInfo(data);
      } catch (err) {
        console.error('Error fetching version info:', err);
        setError('无法获取版本信息');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersionInfo();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  if (isLoading) {
    return <span className="text-xs text-gray-500 dark:text-gray-400">加载中...</span>;
  }

  if (error || !versionInfo) {
    return null; // 如果出错或没有数据，不显示任何内容
  }

  return (
    <>
      <button
        onClick={openModal}
        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
      >
        更新于: {formatDate(versionInfo.latestUpdate)}
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4"
                  >
                    更新日志
                  </Dialog.Title>
                  
                  <div className="mt-2 space-y-4 max-h-96 overflow-y-auto">
                    {versionInfo.commits.map((commit) => (
                      <div key={commit.sha} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {commit.commit.author.name}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(commit.commit.author.date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {commit.commit.message}
                        </p>
                        <a 
                          href={commit.html_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mt-2 inline-block"
                        >
                          查看详情
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-800"
                      onClick={closeModal}
                    >
                      关闭
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}