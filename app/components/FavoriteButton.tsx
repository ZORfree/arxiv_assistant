'use client';

import { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { FavoritesService, FavoriteCategory } from '@/lib/favorites';
import { ArxivPaper } from '@/lib/arxiv';

interface FavoriteButtonProps {
  paper: ArxivPaper & { analysis?: any };
  onFavoriteChange?: (isFavorited: boolean) => void;
  quickFavorite?: boolean; // 是否启用快速收藏（直接收藏到"其他"分类）
}

export default function FavoriteButton({ paper, onFavoriteChange, quickFavorite = false }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(() => FavoritesService.isFavorited(paper.id));
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories] = useState(() => FavoritesService.getCategories());

  const handleFavoriteClick = (e: React.MouseEvent) => {
    if (isFavorited) {
      // 取消收藏
      FavoritesService.removeFavorite(paper.id);
      setIsFavorited(false);
      onFavoriteChange?.(false);
    } else {
      if (quickFavorite || e.shiftKey) {
        // 快速收藏到"其他"分类
        FavoritesService.addFavorite(paper, 'other');
        setIsFavorited(true);
        onFavoriteChange?.(true);
      } else {
        // 显示分类选择模态框
        setShowCategoryModal(true);
      }
    }
  };

  const handleCategorySelect = (categoryId: string, notes?: string) => {
    FavoritesService.addFavorite(paper, categoryId, notes);
    setIsFavorited(true);
    setShowCategoryModal(false);
    onFavoriteChange?.(true);
  };

  return (
    <>
      <button
        onClick={handleFavoriteClick}
        className={`p-2 rounded-full transition-colors ${
          isFavorited
            ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40'
            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title={isFavorited ? '取消收藏' : (quickFavorite ? '快速收藏到其他分类' : '收藏论文（Shift+点击快速收藏）')}
      >
        {isFavorited ? (
          <HeartSolidIcon className="h-5 w-5" />
        ) : (
          <HeartIcon className="h-5 w-5" />
        )}
      </button>

      {/* 分类选择模态框 */}
      {showCategoryModal && (
        <CategorySelectionModal
          paper={paper}
          categories={categories}
          onSelect={handleCategorySelect}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </>
  );
}

interface CategorySelectionModalProps {
  paper: ArxivPaper & { analysis?: any };
  categories: FavoriteCategory[];
  onSelect: (categoryId: string, notes?: string) => void;
  onClose: () => void;
}

function CategorySelectionModal({ paper, categories, onSelect, onClose }: CategorySelectionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelect(selectedCategory, notes.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              收藏论文
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              论文标题
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {paper.title}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                选择分类
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={selectedCategory === category.id}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-3 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${category.color} whitespace-nowrap`}>
                          {category.name}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                备注（可选）
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加一些个人备注..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                收藏
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}