'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { FavoritesService, FavoriteCategory, DEFAULT_CATEGORIES } from '@/lib/favorites';

interface FavoritesManagerProps {
  onClose: () => void;
}

export default function FavoritesManager({ onClose }: FavoritesManagerProps) {
  const [categories, setCategories] = useState(() => FavoritesService.getCategories());
  const [editingCategory, setEditingCategory] = useState<FavoriteCategory | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadCategories = () => {
    setCategories(FavoritesService.getCategories());
  };

  const handleSaveCategory = (category: FavoriteCategory) => {
    const updatedCategories = editingCategory
      ? categories.map(cat => cat.id === editingCategory.id ? category : cat)
      : [...categories, category];
    
    setCategories(updatedCategories);
    FavoritesService.saveCategories(updatedCategories);
    setEditingCategory(null);
    setShowAddForm(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('确定要删除这个分类吗？该分类下的收藏将被移动到"其他"分类。')) {
      // 将该分类下的收藏移动到"其他"分类
      const favorites = FavoritesService.getFavorites();
      favorites.forEach(fav => {
        if (fav.categoryId === categoryId) {
          FavoritesService.updateFavorite(fav.id, { categoryId: 'other' });
        }
      });

      // 删除分类
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      setCategories(updatedCategories);
      FavoritesService.saveCategories(updatedCategories);
    }
  };

  const handleExport = () => {
    const data = FavoritesService.exportFavorites();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paper-favorites-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        if (FavoritesService.importFavorites(data)) {
          alert('导入成功！');
          loadCategories();
        } else {
          alert('导入失败，请检查文件格式。');
        }
      } catch (error) {
        alert('导入失败，请检查文件格式。');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // 重置文件输入
  };

  const handleResetCategories = () => {
    if (confirm('确定要重置为默认分类吗？自定义分类将被删除。')) {
      setCategories(DEFAULT_CATEGORIES);
      FavoritesService.saveCategories(DEFAULT_CATEGORIES);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              收藏夹管理
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>添加分类</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>导出数据</span>
            </button>
            <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer">
              <ArrowUpTrayIcon className="h-4 w-4" />
              <span>导入数据</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={handleResetCategories}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <span>重置分类</span>
            </button>
          </div>

          {/* 分类列表 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              收藏分类
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm rounded-full ${category.color} whitespace-nowrap`}>
                        {category.name}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {FavoritesService.getFavoritesStats().byCategory[category.id] || 0} 篇
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full dark:hover:bg-indigo-900/20"
                      title="编辑"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {!DEFAULT_CATEGORIES.find(cat => cat.id === category.id) && (
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full dark:hover:bg-red-900/20"
                        title="删除"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 添加/编辑分类模态框 */}
      {(showAddForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => {
            setShowAddForm(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

interface CategoryFormProps {
  category?: FavoriteCategory | null;
  onSave: (category: FavoriteCategory) => void;
  onClose: () => void;
}

function CategoryForm({ category, onSave, onClose }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [color, setColor] = useState(category?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100');

  const colorOptions = [
    { value: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100', label: '蓝色' },
    { value: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', label: '绿色' },
    { value: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100', label: '紫色' },
    { value: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100', label: '橙色' },
    { value: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100', label: '粉色' },
    { value: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100', label: '靛蓝' },
    { value: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', label: '红色' },
    { value: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100', label: '黄色' },
    { value: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100', label: '灰色' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCategory: FavoriteCategory = {
      id: category?.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description.trim() || undefined,
      color
    };

    onSave(newCategory);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {category ? '编辑分类' : '添加分类'}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                分类名称 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入分类名称"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入分类描述（可选）"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                颜色
              </label>
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-2 border border-gray-200 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="radio"
                      name="color"
                      value={option.value}
                      checked={color === option.value}
                      onChange={(e) => setColor(e.target.value)}
                      className="mr-2"
                    />
                    <span className={`px-2 py-1 text-xs rounded-full ${option.value}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
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
                {category ? '保存' : '添加'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}