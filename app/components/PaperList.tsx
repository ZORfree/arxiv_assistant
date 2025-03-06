'use client';

import { ArxivPaper } from '@/lib/arxiv';
import { PaperAnalysis } from '@/lib/ai';

interface PaperListProps {
  papers: Array<ArxivPaper & { analysis?: PaperAnalysis }>;
  loading?: boolean;
  currentPage: number;
  totalPapers: number;
  onPageChange: (page: number) => void;
  onRetryAnalysis?: (paper: ArxivPaper) => void;
}

export default function PaperList({ papers, loading, currentPage, totalPapers, onPageChange, onRetryAnalysis }: PaperListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div>
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          暂无论文数据
        </div>
        {totalPapers > 10 && (
          <div className="mt-8 flex justify-center items-center space-x-4">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              上一页
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-200">
              第 {currentPage} 页 / 共 {Math.ceil(totalPapers / 10)} 页
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalPapers / 10)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className={`p-6 rounded-lg shadow-sm border ${paper.analysis?.isRelevant ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  <a
                    href={paper.link}
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
                <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
                  {paper.authors.join(', ')}
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-100">
                    {paper.summary}
                  </p>
                  {paper.analysis?.summaryTrans && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {paper.analysis.summaryTrans}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {paper.categories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              {paper.analysis && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        paper.analysis.isRelevant
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      相关度: {paper.analysis.score}%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                      {paper.analysis.reason}
                    </p>
                    {paper.analysis.reason === '分析失败' && onRetryAnalysis && (
                      <button
                        onClick={() => onRetryAnalysis(paper)}
                        className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/40"
                      >
                        重新分析
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {totalPapers > 10 && (
        <div className="mt-8 flex justify-center items-center space-x-4">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            上一页
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-200">
            第 {currentPage} 页 / 共 {Math.ceil(totalPapers / 10)} 页
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= Math.ceil(totalPapers / 10)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}