'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FolderIcon, HeartIcon, TrashIcon, PencilIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { FavoritesService, FavoritePaper, FavoriteCategory } from '@/lib/favorites';
import FavoritesManager from './FavoritesManager';

interface FavoritesPageProps {
  onClose: () => void;
}

export default function FavoritesPage({ onClose }: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<FavoritePaper[]>([]);
  const [categories, setCategories] = useState<FavoriteCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPaper, setEditingPaper] = useState<FavoritePaper | null>(null);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setFavorites(FavoritesService.getFavorites());
    setCategories(FavoritesService.getCategories());
  };

  const filteredFavorites = favorites.filter(fav => {
    const matchesCategory = selectedCategory === 'all' || fav.categoryId === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      fav.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      fav.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleRemoveFavorite = (paperId: string) => {
    if (confirm('确定要取消收藏这篇论文吗？')) {
      FavoritesService.removeFavorite(paperId);
      loadData();
    }
  };

  const handleUpdateFavorite = (paperId: string, updates: Partial<Pick<FavoritePaper, 'categoryId' | 'notes'>>) => {
    FavoritesService.updateFavorite(paperId, updates);
    loadData();
    setEditingPaper(null);
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const stats = FavoritesService.getFavoritesStats();

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 overflow-y-auto">
      <div className="min-h-screen">
        {/* 头部 */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <HeartIcon className="h-8 w-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    我的收藏
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    共收藏了 {stats.total} 篇论文
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowManager(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 flex items-center space-x-2"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  <span>管理</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  返回
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 侧边栏 */}
            <aside className="lg:w-64 space-y-6">
              {/* 搜索 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索收藏的论文..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* 分类筛选 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <FolderIcon className="h-4 w-4 mr-2" />
                  分类筛选
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>全部</span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                        {stats.total}
                      </span>
                    </div>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                          {stats.byCategory[category.id] || 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* 主内容区 */}
            <main className="flex-1">
              {filteredFavorites.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                  <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchQuery || selectedCategory !== 'all' ? '没有找到匹配的论文' : '还没有收藏任何论文'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery || selectedCategory !== 'all' 
                      ? '尝试调整搜索条件或选择其他分类'
                      : '开始浏览论文并收藏感兴趣的内容吧'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFavorites.map((paper) => (
                    <FavoritePaperCard
                      key={paper.favoriteId}
                      paper={paper}
                      category={getCategoryById(paper.categoryId)}
                      onRemove={() => handleRemoveFavorite(paper.id)}
                      onEdit={() => setEditingPaper(paper)}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* 编辑模态框 */}
      {editingPaper && (
        <EditFavoriteModal
          paper={editingPaper}
          categories={categories}
          onSave={handleUpdateFavorite}
          onClose={() => setEditingPaper(null)}
        />
      )}

      {/* 收藏夹管理模态框 */}
      {showManager && (
        <FavoritesManager
          onClose={() => {
            setShowManager(false);
            loadData(); // 重新加载数据以反映管理器中的更改
          }}
        />
      )}
    </div>
  );
}

interface FavoritePaperCardProps {
  paper: FavoritePaper;
  category?: FavoriteCategory;
  onRemove: () => void;
  onEdit: () => void;
}

function FavoritePaperCard({ paper, category, onRemove, onEdit }: FavoritePaperCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            <a
              href={`https://papers.cool/arxiv/${paper.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400"
            >
              {paper.title}
            </a>
            {paper.analysis?.titleTrans && (
              <div className="mt-1 text-base text-gray-600 dark:text-gray-300">
                {paper.analysis.titleTrans}
              </div>
            )}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-200 mb-2">
            {paper.authors.join(', ')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            收藏时间：{new Date(paper.favoritedAt).toLocaleDateString('zh-CN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full dark:hover:bg-indigo-900/20"
            title="编辑"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full dark:hover:bg-red-900/20"
            title="删除"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-100">
            {paper.summary}
          </p>
          {paper.analysis?.summaryTrans && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {paper.analysis.summaryTrans}
            </p>
          )}
        </div>

        {paper.notes && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>备注：</strong>{paper.notes}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {category && (
              <span className={`px-2 py-1 text-xs rounded-full ${category.color}`}>
                {category.name}
              </span>
            )}
            {paper.categories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200"
              >
                {cat}
              </span>
            ))}
          </div>
          {paper.analysis && (
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
              paper.analysis.isRelevant
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              相关度: {paper.analysis.score}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EditFavoriteModalProps {
  paper: FavoritePaper;
  categories: FavoriteCategory[];
  onSave: (paperId: string, updates: Partial<Pick<FavoritePaper, 'categoryId' | 'notes'>>) => void;
  onClose: () => void;
}

function EditFavoriteModal({ paper, categories, onSave, onClose }: EditFavoriteModalProps) {
  const [categoryId, setCategoryId] = useState(paper.categoryId);
  const [notes, setNotes] = useState(paper.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(paper.id, {
      categoryId,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              编辑收藏
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
                分类
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                备注
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加一些个人备注..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
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
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}