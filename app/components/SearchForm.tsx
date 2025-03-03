'use client';

import { useState, useEffect } from 'react';
import { ArxivSearchParams } from '@/lib/arxiv';

interface SearchFormProps {
  onSearch: (params: ArxivSearchParams & { showRelevantOnly: boolean }) => void;
  loading?: boolean;
  showRelevantOnly: boolean;
  onShowRelevantOnlyChange: (value: boolean) => void;
  totalPapers?: number;
}

const ARXIV_CATEGORIES = [
  { value: 'cs.AI', label: '人工智能' },
  { value: 'cs.CL', label: '计算语言学' },
  { value: 'cs.CV', label: '计算机视觉' },
  { value: 'cs.LG', label: '机器学习' },
  { value: 'cs.SD', label: '软件工程' },
  { value: 'eess.AS', label: '音频与语音处理' },
  { value: 'eess.IV', label: '图像与视频处理' },
  { value: 'eess.SP', label: '信号处理' }
];

export default function SearchForm({ onSearch, loading, showRelevantOnly, onShowRelevantOnlyChange, totalPapers }: SearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cachedPapersCount, setCachedPapersCount] = useState(0);
  const [filteredCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const savedSearch = localStorage.getItem('last_search');
    if (savedSearch) {
      const { keyword, categories, startDate, endDate } = JSON.parse(savedSearch);
      setKeyword(keyword || '');
      setSelectedCategories(categories || []);
      setStartDate(startDate || '');
      setEndDate(endDate || '');
    }

    // 获取已缓存的论文数量
    const keys = Object.keys(localStorage);
    const analysisCount = keys.filter(key => key.startsWith('paper_analysis_')).length;
    setCachedPapersCount(analysisCount);

    // 获取保存的主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = {
      keyword: keyword.trim(),
      categories: selectedCategories,
      startDate,
      endDate,
      showRelevantOnly
    };
    localStorage.setItem('last_search', JSON.stringify(searchParams));
    onSearch(searchParams);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleClearCache = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('paper_analysis_')) {
        localStorage.removeItem(key);
      }
    });
    setCachedPapersCount(0);
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            关键词搜索
          </label>
          <input
            type="text"
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入关键词搜索论文"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            论文分类
          </label>
          <div className="flex flex-wrap gap-2">
            {ARXIV_CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleCategoryToggle(value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategories.includes(value)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              开始日期
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              结束日期
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                checked={showRelevantOnly}
                onChange={(e) => onShowRelevantOnlyChange(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">仅显示相关论文</span>
            </label>
            {totalPapers !== undefined && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                共找到 {totalPapers} 篇论文
              </span>
            )}
          </div>
          {cachedPapersCount > 0 && (
          <button
            type="button"
            onClick={handleClearCache}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:border-red-700 dark:text-gray-100 dark:hover:bg-red-800 dark:hover:border-red-800"
          >
            清除缓存 ({cachedPapersCount} 篇论文)
          </button>
         )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '搜索中...' : '开始搜索'}
          </button>
        </div>
      </form>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {filteredCount > 0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">已过滤 {filteredCount} 篇不相关的论文</span>
          )}
        </div>
      </div>

      {/* 主题切换按钮 - 固定在右下角 */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-50"
        aria-label={isDarkMode ? '切换到亮色主题' : '切换到暗色主题'}
      >
        {isDarkMode ? (
          <svg className="w-6 h-6 text-gray-800 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-gray-800 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </div>
  );
}