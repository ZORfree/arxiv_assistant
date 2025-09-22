'use client';

import { useEffect, useState } from 'react';
import { ArxivAPI, ArxivPaper, ArxivSearchParams } from '@/lib/arxiv';
import { AIService, UserPreference } from '@/lib/ai';
import SearchForm from './components/SearchForm';
import PaperList from './components/PaperList';
import Settings from './components/Settings';
import VersionInfo from './components/VersionInfo';
import FavoritesPage from './components/FavoritesPage';
import FavoritesStats from './components/FavoritesStats';
import FavoritesGuide from './components/FavoritesGuide';

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
      alert('获取论文失败，请稍后重试');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 三栏布局容器 */}
      <div className="flex min-h-screen">
        {/* 左侧空白区域 (1份宽度) */}
        <div className="flex-1 hidden xl:block"></div>
        
        {/* 中间主内容区域 (2份宽度) */}
        <main className="flex-[2] p-8 space-y-8">
          {/* 头部 */}
          <header>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              ArXiv 论文筛选助手
            </h1>
            <div className="flex items-center space-x-2 mb-2">
              <p className="text-gray-600 dark:text-gray-300">
                设置您的研究偏好，让AI帮您找到感兴趣的论文
              </p>
              <VersionInfo />
              <FavoritesGuide />
            </div>
          </header>

          {/* 主要内容 */}
          <div className="space-y-8">
          {showPreferences && (
            <Settings
              onSave={handlePreferenceSave}
              initialPreferences={preferences || undefined}
              onClose={() => setShowPreferences(false)}
            />
          )}

          {preferences && (
            <section className="space-y-4 w-full">
              {/* 移动端按钮 - 只在小屏幕显示 */}
              <div className="xl:hidden flex justify-end space-x-3 mb-4">
                <button
                  onClick={() => setShowFavorites(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center space-x-2 text-sm"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span>收藏夹</span>
                </button>
                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
                >
                  设置
                </button>
              </div>

              <SearchForm
                onSearch={handleSearch}
                loading={loading}
                showRelevantOnly={showRelevantOnly}
                onShowRelevantOnlyChange={setShowRelevantOnly}
                totalPapers={allPapers.length}
              />
              
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
            </section>
          )}
        </div>
        </main>

        {/* 右侧功能区域 (1份宽度) */}
        <aside className="flex-1 hidden xl:block p-8 border-l border-gray-200 dark:border-gray-700">
          <div className="sticky top-8 space-y-4 max-w-xs mx-auto">
            {preferences && (
              <>
                {/* 操作按钮 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    快捷操作
                  </h3>
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={() => setShowFavorites(true)}
                      className="w-24 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center space-x-1 text-sm"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span>收藏夹</span>
                    </button>
                    <button
                      onClick={() => setShowPreferences(true)}
                      className="w-24 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
                    >
                      设置偏好
                    </button>
                  </div>
                </div>
                
                <FavoritesStats />
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}