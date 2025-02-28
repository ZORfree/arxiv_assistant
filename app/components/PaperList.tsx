'use client';

import { ArxivPaper } from '@/lib/arxiv';
import { PaperAnalysis } from '@/lib/ai';

interface PaperListProps {
  papers: Array<ArxivPaper & { analysis?: PaperAnalysis }>;
  loading?: boolean;
  showRelevantOnly?: boolean;
}

export default function PaperList({ papers, loading, showRelevantOnly = false }: PaperListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        暂无论文数据
      </div>
    );
  }

  const filteredPapers = showRelevantOnly
    ? papers.filter(paper => paper.analysis?.isRelevant)
    : papers;

  const filteredCount = papers.length - filteredPapers.length;

  return (
    <div className="space-y-6">
      {filteredPapers.map((paper) => (
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
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}