'use client';

import { useEffect, useState } from 'react';
import { ArxivAPI, ArxivPaper, ArxivSearchParams } from '@/lib/arxiv';
import { AIService, UserPreference } from '@/lib/ai';
import SearchForm from './components/SearchForm';
import PaperList from './components/PaperList';
import SettingsPage from './components/SettingsPage';
import VersionInfo from './components/VersionInfo';
import FavoritesPage from './components/FavoritesPage';
import FavoritesStats from './components/FavoritesStats';


const PAPERS_PER_PAGE = 10;

export default function Home() {
  const [allPapers, setAllPapers] = useState<ArxivPaper[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [papers, setPapers] = useState<Array<ArxivPaper & { analysis?: { isRelevant: boolean; reason: string; score: number; titleTrans: string; summaryTrans: string; } }>>([]);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [showPreferences, setShowPreferences] = useState(true);
  const [showRelevantOnly, setShowRelevantOnly] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [totalAnalysisCount, setTotalAnalysisCount] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);
  const [arxivError, setArxivError] = useState<{ type: 'cors' | 'other'; message: string } | null>(null);

  useEffect(() => {
    const savedPreferences = localStorage.getItem('user_preferences');
    if (savedPreferences) {
      const parsedPreferences = JSON.parse(savedPreferences);
      setPreferences(parsedPreferences);
      setShowPreferences(false);
    }
  }, []);
  const handlePreferenceSave = async (newPreferences: UserPreference) => {
    // 只有在研究偏好（profession、interests、nonInterests）发生变化时才重置用户ID
    const oldPreferences = preferences;
    const needResetUserId = !oldPreferences || 
      oldPreferences.profession !== newPreferences.profession || 
      JSON.stringify(oldPreferences.interests) !== JSON.stringify(newPreferences.interests) || 
      JSON.stringify(oldPreferences.nonInterests) !== JSON.stringify(newPreferences.nonInterests);
    
    if (needResetUserId) {
      // 正确导入UserService类并调用其resetUserId方法
      const { UserService } = await import('@/lib/user');
      UserService.resetUserId();
      console.log('用户ID已重置，研究偏好发生变化');
    } else {
      console.log('API配置变更，无需重置用户ID');
    }
    
    setPreferences(newPreferences);
    setShowPreferences(false);
    localStorage.setItem('user_preferences', JSON.stringify(newPreferences));
    // 只有在用户ID重置时才重新分析论文
    if (papers.length > 0 && needResetUserId) {
      await analyzePapers(papers, newPreferences);
    }
  };
  const analyzePapers = async (papers: ArxivPaper[], preferences: UserPreference) => {
    try {
      setIsAnalyzing(true);
      setAnalyzedCount(0);
      setTotalAnalysisCount(papers.length);
      // 初始化论文列表，每篇论文的分析结果初始为 undefined
      setPapers(papers.map(paper => ({ ...paper })));
      
      // 使用批量分析方法，确保并发请求数量不超过限制
      const paperDataForAnalysis = papers.map(paper => ({
        title: paper.title,
        summary: paper.summary,
        categories: paper.categories,
        link: paper.link,
        id: paper.id
      }));
      
      // 创建一个进度更新函数
      const updateProgress = (completedCount: number) => {
        setAnalyzedCount(completedCount);
      };
      // 重写批量分析方法，支持进度回调
      const batchAnalyze = async () => {
        // 从用户设置中获取最大并发请求数，而不是从环境变量
        const maxConcurrent = preferences.apiConfig?.maxConcurrentRequests || 2;
        const results: Array<{
          isRelevant: boolean;
          reason: string;
          score: number;
          titleTrans: string;
          summaryTrans: string;
        }> = new Array(papers.length);
        
        const failureResult = {
          isRelevant: false,
          reason: '分析失败',
          score: 0,
          titleTrans: '',
          summaryTrans: ''
        };
        
        const queue = paperDataForAnalysis.map((paper, index) => ({ paper, index }));
        let completedCount = 0;
        
        while (queue.length > 0) {
          const batch = queue.splice(0, maxConcurrent);
          const batchPromises = batch.map(({ paper, index }) =>
            AIService.analyzePaper(paper, preferences)
              .then(result => {
                results[index] = result;
                completedCount++;
                updateProgress(completedCount);
                
                // 立即更新这篇论文的分析结果
                setPapers(currentPapers => {
                  const newPapers = [...currentPapers];
                  newPapers[index] = { ...newPapers[index], analysis: result };
                  return newPapers;
                });
              })
              .catch(() => {
                results[index] = failureResult;
                completedCount++;
                updateProgress(completedCount);
                
                // 更新失败状态
                setPapers(currentPapers => {
                  const newPapers = [...currentPapers];
                  newPapers[index] = {
                    ...newPapers[index],
                    analysis: failureResult
                  };
                  return newPapers;
                });
              })
          );
          
          // 等待当前批次的所有请求完成后再处理下一批
          await Promise.all(batchPromises);
        }
        
        return results;
      };
      
      await batchAnalyze();
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Error analyzing papers:', error);
      alert('论文分析失败，请检查API配置并重试');
      setIsAnalyzing(false);
    }
  };
  const handleSearch = async (searchParams: ArxivSearchParams) => {
    if (!preferences) {
      alert('请先设置您的偏好');
      setShowPreferences(true);
      return;
    }

    setLoading(true);
    setArxivError(null); // 清除之前的错误
    try {
      const fetchedPapers = await ArxivAPI.searchPapers(searchParams);
      setAllPapers(fetchedPapers);
      setCurrentPage(1);
      const firstPagePapers = fetchedPapers.slice(0, PAPERS_PER_PAGE);
      // 先设置原始论文数据
      setPapers(firstPagePapers.map(paper => ({ ...paper })));
      setLoading(false);
      // 再进行分析
      await analyzePapers(firstPagePapers, preferences);
    } catch (error) {
      console.error('Error fetching papers:', error);

      // 检测是否是CORS错误
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCorsError = errorMessage.includes('CORS') ||
                          errorMessage.includes('Network') ||
                          errorMessage.includes('Failed to fetch') ||
                          (error && typeof error === 'object' && 'name' in error && error.name === 'TypeError');

      // 检查环境变量中是否已设置代理URL
      const hasProxyUrl = (process.env.NEXT_PUBLIC_ARXIV_PROXY_URL || process.env.ARXIV_PROXY_URL || '').trim().length > 0;

      if (isCorsError && !hasProxyUrl) {
        setArxivError({
          type: 'cors',
          message: '由于浏览器CORS安全策略限制，无法直接访问ArXiv API'
        });
      } else {
        setArxivError({
          type: 'other',
          message: errorMessage || '获取论文失败，请稍后重试'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleRetryAnalysis = async (paper: ArxivPaper) => {
    if (!preferences) return;
    
    try {
      setIsAnalyzing(true);
      setAnalyzedCount(0);
      setTotalAnalysisCount(1);
      
      const analysis = await AIService.analyzePaper(
        {
          title: paper.title,
          summary: paper.summary,
          categories: paper.categories,
          link:paper.link,
          id:paper.id
        },
        preferences
      );
      
      setPapers(currentPapers => {
        return currentPapers.map(p => {
          if (p.id === paper.id) {
            return { ...p, analysis };
          }
          return p;
        });
      });
      setAnalyzedCount(1);
    } catch (error) {
      console.error(`重新分析论文失败: ${paper.title}`, error);
      setPapers(currentPapers => {
        return currentPapers.map(p => {
          if (p.id === paper.id) {
            return {
              ...p,
              analysis: {
                isRelevant: false,
                reason: '分析失败',
                score: 0,
                titleTrans: "",
                summaryTrans: ""
              }
            };
          }
          return p;
        });
      });
      setAnalyzedCount(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 如果显示收藏夹页面，直接返回收藏夹组件
  if (showFavorites) {
    return <FavoritesPage onClose={() => setShowFavorites(false)} />;
  }

  // 如果显示设置页面，直接返回设置页面组件
  if (showPreferences) {
    return (
      <SettingsPage
        onSave={handlePreferenceSave}
        initialPreferences={preferences || undefined}
        onClose={() => setShowPreferences(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 头部标题区域 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ArXiv 助手
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="hidden sm:inline">设置您的研究偏好，让AI帮您找到感兴趣的论文</span>
                  <span className="sm:hidden">AI帮您筛选</span>
                </p>
              </div>
            </div>
            {/* 版本信息和GitHub链接 - 桌面端显示 */}
            <div className="hidden lg:flex items-center space-x-3">
              <VersionInfo />
              <a
                href="https://github.com/ZORfree/arxiv_assistant"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="访问GitHub仓库"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
            {/* 移动端快捷按钮 */}
            <div className="lg:hidden flex items-center space-x-3">
              {preferences && (
                <>
                  <button
                    onClick={() => setShowFavorites(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center space-x-2 text-sm"
                  >
                    收藏夹
                  </button>
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
                  >
                    个性化
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {preferences && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 左侧边栏：快捷操作和收藏统计 */}
            <aside className="lg:w-64 space-y-6">
              {/* 快捷操作 */}
              <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-3">
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    快捷操作
                  </h3>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowFavorites(true)}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center space-x-2 text-sm font-medium"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span>管理收藏夹</span>
                  </button>
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                    </svg>
                    <span>个性化设置</span>
                  </button>
                </div>
              </div>
              
              {/* 收藏统计 */}
              <div className="hidden lg:block">
                <FavoritesStats />
              </div>
              
              {/* 作者信息 */}
              <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Built by{' '}
                    <a
                      href="https://github.com/ZORfree"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                    >
                      ZORfree
                    </a>
                  </p>
                  <div className="flex items-center justify-center mt-2 space-x-1">
                    <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Open Source</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* 右侧主内容：搜索表单和论文列表 */}
            <main className="flex-1 space-y-6">
              <SearchForm
                onSearch={handleSearch}
                loading={loading}
                showRelevantOnly={showRelevantOnly}
                onShowRelevantOnlyChange={setShowRelevantOnly}
                totalPapers={allPapers.length}
              />

              {/* ArXiv错误提示 */}
              {arxivError && (
                <div className={`rounded-lg p-4 shadow-sm border ${
                  arxivError.type === 'cors'
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className={`h-5 w-5 ${
                          arxivError.type === 'cors'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className={`text-sm font-medium ${
                        arxivError.type === 'cors'
                          ? 'text-yellow-800 dark:text-yellow-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        {arxivError.type === 'cors' ? '无法访问ArXiv API' : '搜索失败'}
                      </h3>
                      <div className={`mt-2 text-sm ${
                        arxivError.type === 'cors'
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        <p>{arxivError.message}</p>
                        {arxivError.type === 'cors' && (
                          <div className="mt-3">
                            <p className="font-medium mb-2">解决方案：</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>联系管理员配置ArXiv 代理 URL</li>
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <div className="flex space-x-3">
                          
                          <button
                            type="button"
                            onClick={() => setArxivError(null)}
                            className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              arxivError.type === 'cors'
                                ? 'border-yellow-300 text-yellow-700 bg-white hover:bg-yellow-50 focus:ring-yellow-500 dark:bg-gray-800 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900'
                                : 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500 dark:bg-gray-800 dark:text-red-200 dark:border-red-600 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900'
                            }`}
                          >
                            关闭
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      正在分析论文 ({analyzedCount}/{totalAnalysisCount})
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {Math.round((analyzedCount / totalAnalysisCount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${(analyzedCount / totalAnalysisCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              <PaperList
                papers={showRelevantOnly ? papers.filter(paper => paper.analysis?.isRelevant) : papers}
                loading={loading}
                currentPage={currentPage}
                totalPapers={allPapers.length}
                onPageChange={async (page) => {
                  setCurrentPage(page);
                  const startIndex = (page - 1) * PAPERS_PER_PAGE;
                  const endIndex = startIndex + PAPERS_PER_PAGE;
                  const pagePapers = allPapers.slice(startIndex, endIndex);
                  await analyzePapers(pagePapers, preferences!);
                }}
                onRetryAnalysis={handleRetryAnalysis}
              />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}