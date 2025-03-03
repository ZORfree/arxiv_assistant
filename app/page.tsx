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
  const [papers, setPapers] = useState<Array<ArxivPaper & { analysis?: any }>>([]);
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
      await analyzePapers(papers, newPreferences, currentPage);
    }
  };
  const analyzePapers = async (papers: ArxivPaper[], preferences: UserPreference, page: number) => {
    try {
      setIsAnalyzing(true);
      setAnalyzedCount(0);
      setTotalAnalysisCount(papers.length);
      // 初始化论文列表，每篇论文的分析结果初始为 undefined
      setPapers(papers.map(paper => ({ ...paper })));
      
      // 并行处理所有论文的分析
      const analysisPromises = papers.map(async (paper, index) => {
        try {
          const analysis = await AIService.analyzePaper(
            {
              title: paper.title,
              summary: paper.summary,
              categories: paper.categories
            },
            preferences
          );
          
          // 立即更新这篇论文的分析结果
          setPapers(currentPapers => {
            const newPapers = [...currentPapers];
            newPapers[index] = { ...newPapers[index], analysis };
            return newPapers;
          });
          setAnalyzedCount(prev => prev + 1);
        } catch (error) {
          console.error(`分析论文失败: ${paper.title}`, error);
          setPapers(currentPapers => {
            const newPapers = [...currentPapers];
            newPapers[index] = {
              ...newPapers[index],
              analysis: {
                isRelevant: false,
                reason: '分析失败',
                score: 0,
                titleTrans: "",
                summaryTrans: ""
              }
            };
            return newPapers;
          });
          setAnalyzedCount(prev => prev + 1);
        }
      });

      // 等待所有分析完成
      await Promise.all(analysisPromises);
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
      await analyzePapers(firstPagePapers, preferences, 1);
    } catch (error) {
      console.error('Error fetching papers:', error);
      alert('获取论文失败，请稍后重试');
    } finally {
      setLoading(false);
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
                  await analyzePapers(pagePapers, preferences!, page);
                }}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
