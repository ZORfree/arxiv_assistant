import axios from 'axios';

export interface UserPreference {
  profession: string;
  interests: string[];
  nonInterests: string[];
}

export interface PaperAnalysis {
  isRelevant: boolean;
  reason: string;
  score: number;
  titleTrans: string;
  summaryTrans: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CachedAnalysis extends PaperAnalysis {
  timestamp: number;
}

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7天过期

export class AIService {

  private static getCacheKey(paper: { title: string; summary: string }): string {
    return `paper_analysis_${btoa(paper.title + paper.summary)}`;
  }

  private static getFromCache(paper: { title: string; summary: string }): PaperAnalysis | null {
    // 在服务端环境中禁用缓存
    return null;
  }

  private static saveToCache(paper: { title: string; summary: string }, analysis: PaperAnalysis): void {
    // 在服务端环境中禁用缓存
  }

  static async analyzePaper(paper: {
    title: string;
    summary: string;
    categories: string[];
  }, preference: UserPreference): Promise<PaperAnalysis> {
    // 先尝试从缓存获取
    const cached = this.getFromCache(paper);
    if (cached) return cached;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paper, preference })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze paper');
      }

      const result = await response.json();
      
      // 保存到缓存，无论论文是否相关都进行缓存
      this.saveToCache(paper, result);
      
      return result as PaperAnalysis;
    } catch (error) {
      console.error('[AI] 论文分析失败:', error);
      throw new Error('Failed to analyze paper with AI');
    }
  }

  static async batchAnalyzePapers(papers: Array<{
    title: string;
    summary: string;
    categories: string[];
  }>, preference: UserPreference): Promise<PaperAnalysis[]> {
    const results: PaperAnalysis[] = [];
    
    for (const paper of papers) {
      try {
        const analysis = await this.analyzePaper(paper, preference);
        results.push(analysis);
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error analyzing paper: ${paper.title}`, error);
        results.push({
          isRelevant: false,
          reason: 'Analysis failed',
          score: 0,
          titleTrans: "",
          summaryTrans: ""
        });
      }
    }

    return results;
  }
}