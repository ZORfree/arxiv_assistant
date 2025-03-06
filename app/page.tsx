'use client';

import { useEffect, useState } from 'react';
import { ArxivAPI, ArxivPaper, ArxivSearchParams } from '@/lib/arxiv';
import { AIService, UserPreference } from '@/lib/ai';
import PreferenceForm from './components/PreferenceForm';
import SearchForm from './components/SearchForm';
import PaperList from './components/PaperList';

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

  useEffect(() => {
    const savedPreferences = localStorage.getItem('user_preferences');
    if (savedPreferences) {
      const parsedPreferences = JSON.parse(savedPreferences);
      setPreferences(parsedPreferences);
      setShowPreferences(false);
    }
  }, []);
  const handlePreferenceSave = async (newPreferences: UserPreference) => {
    setPreferences(newPreferences);
    setShowPreferences(false);
    localStorage.setItem('user_preferences', JSON.stringify(newPreferences));
    if (papers.length > 0) {
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
        categories: paper.categories
      }));
      
      // 创建一个进度更新函数
      const updateProgress = (completedCount: number) => {
        setAnalyzedCount(completedCount);
      };
      
      // 重写批量分析方法，支持进度回调
      const batchAnalyze = async () => {
        const maxConcurrent = Number(process.env.MAX_CONCURRENT_REQUESTS || '2');
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
          categories: paper.categories
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

  return (
    <div className="min-h-screen p-8 space-y-8 bg-gray-50 dark:bg-gray-900">
      <header className="max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ArXiv 论文筛选助手
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            设置您的研究偏好，让AI帮您找到感兴趣的论文
          </p>
        </div>
        {preferences && (
          <button
            onClick={() => setShowPreferences(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            修改偏好设置
          </button>
        )}
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        {showPreferences && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <PreferenceForm
                onSave={handlePreferenceSave}
                initialPreferences={preferences || undefined}
              />
            </div>
          </div>
        )}

        {preferences && (
          <section className="space-y-4 w-full">
            <div className="w-full">
              <SearchForm
                onSearch={handleSearch}
                loading={loading}
                showRelevantOnly={showRelevantOnly}
                onShowRelevantOnlyChange={setShowRelevantOnly}
                totalPapers={allPapers.length}
              />
            </div>
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
            <div className="w-full">
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
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
