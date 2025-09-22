'use client';

import { useState, useEffect } from 'react';
import { HeartIcon, FolderIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { FavoritesService, FavoriteCategory } from '@/lib/favorites';

interface FavoritesStats {
  total: number;
  byCategory: Record<string, number>;
}

export default function FavoritesStats() {
  const [stats, setStats] = useState<FavoritesStats>({ total: 0, byCategory: {} });
  const [categories, setCategories] = useState<FavoriteCategory[]>([]);

  useEffect(() => {
    const updateStats = () => {
      setStats(FavoritesService.getFavoritesStats());
      setCategories(FavoritesService.getCategories());
    };

    updateStats();
    
    // 监听存储变化
    const handleStorageChange = () => {
      updateStats();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 定期更新统计（用于同一页面内的变化）
    const interval = setInterval(updateStats, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (stats.total === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2 mb-3">
        <ChartBarIcon className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          收藏统计
        </h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HeartIcon className="h-4 w-4 text-red-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">总收藏</span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {stats.total} 篇
          </span>
        </div>
        
        {Object.entries(stats.byCategory).map(([categoryId, count]) => {
          const category = categories.find(cat => cat.id === categoryId);
          if (!category || count === 0) return null;
          
          return (
            <div key={categoryId} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderIcon className="h-4 w-4 text-gray-400" />
                <span className={`text-xs px-2 py-1 rounded-full ${category.color}`}>
                  {category.name}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {count} 篇
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}