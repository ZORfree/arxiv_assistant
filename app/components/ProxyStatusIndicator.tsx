'use client';

import { useState, useEffect } from 'react';
import { ProxyStatusService, ProxyStatus } from '@/lib/proxy-status';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ProxyStatusIndicatorProps {
  type: 'llm' | 'webdav';
  className?: string;
}

export default function ProxyStatusIndicator({ type, className = '' }: ProxyStatusIndicatorProps) {
  const [status, setStatus] = useState<ProxyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const proxyStatus = await ProxyStatusService.getProxyStatus();
        setStatus(proxyStatus);
      } catch (error) {
        console.error('获取代理状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
        <span className="text-sm text-gray-500 dark:text-gray-400">检查代理状态...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <XCircleIcon className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-600 dark:text-red-400">无法获取代理状态</span>
      </div>
    );
  }

  const currentStatus = type === 'llm' ? status.llm : status.webdav;
  const Icon = currentStatus.enabled ? CheckCircleIcon : XCircleIcon;
  const colorClass = currentStatus.enabled 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Icon className={`h-4 w-4 ${colorClass}`} />
      <span className={`text-sm ${colorClass}`}>
        {currentStatus.message}
      </span>
    </div>
  );
}

/**
 * 代理状态警告组件
 * 当代理服务不可用时显示警告信息
 */
interface ProxyWarningProps {
  type: 'llm' | 'webdav';
  show: boolean;
  className?: string;
}

export function ProxyWarning({ type, show, className = '' }: ProxyWarningProps) {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (show) {
      ProxyStatusService.getUnavailableMessage(type).then(setMessage);
    }
  }, [show, type]);

  if (!show || !message) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 dark:bg-yellow-900/20 dark:border-yellow-800 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            代理服务不可用
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>{message}</p>
            <p className="mt-1">
              {type === 'llm' 
                ? '您仍可以使用直连模式，但可能遇到网络限制或CORS问题。' 
                : '您仍可以使用直连模式，但可能遇到CORS跨域问题。'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}