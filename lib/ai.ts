import { UserService } from "./user";

export interface UserPreference {
  profession: string;
  interests: string[];
  nonInterests: string[];
  apiConfig?: {
    apiKey: string;
    apiBaseUrl: string;
    model: string;
    maxConcurrentRequests: number;
  };
  arxivProxyUrl?: string; // 新增：ArXiv代理URL配置，可选
}

export interface PaperAnalysis {
  isRelevant: boolean;
  reason: string;
  score: number;
  titleTrans: string;
  summaryTrans: string;
}

export class AIService {
  private static validateMaxConcurrent(preference: UserPreference) {
    const max = preference.apiConfig?.maxConcurrentRequests || 2;
    console.info('[AI] 最大请求次数设置为: ', max);
    if (isNaN(max) || max < 1 || max > 10) {
      console.warn('[AI] Invalid maxConcurrentRequests value in user preferences, using default: 2');
      return 2;
    }
    return max;
  }
  
  static async analyzePaper(paper: {
    link: string;
    id: string;
    title: string;
    summary: string;
    categories: string[];
  }, userpreference: UserPreference): Promise<PaperAnalysis> {
    try {
      const userId = UserService.getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }
  
      if (!userpreference.apiConfig) {
        throw new Error('API configuration not found in user preferences');
      }
  
      const response = await fetch(`/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paper, 
          userpreference, 
          userId,
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to analyze paper');
      }
  
      const result = await response.json();
      return result as PaperAnalysis;
    } catch (error) {
      console.error('[AI] 论文分析失败:', error);
      throw new Error('Failed to analyze paper with AI');
    }
  }
  
  static async batchAnalyzePapers(papers: Array<{
    link: string;
    id: string;
    title: string;
    summary: string;
    categories: string[];
  }>, preference: UserPreference): Promise<PaperAnalysis[]> {
    const maxConcurrent = this.validateMaxConcurrent(preference);
    const results: PaperAnalysis[] = new Array(papers.length);
    const failureResult: PaperAnalysis = {
      isRelevant: false,
      reason: '分析失败',
      score: 0,
      titleTrans: '',
      summaryTrans: ''
    };
  
    const queue = papers.map((paper, index) => ({ paper, index }));
    
    while (queue.length > 0) {
      const batch = queue.splice(0, maxConcurrent);
      const batchPromises = batch.map(({ paper, index }) =>
        this.analyzePaper(paper, preference)
          .then(result => {
            results[index] = result;
          })
          .catch(() => {
            results[index] = failureResult;
          })
      );
      
      // 等待当前批次的所有请求完成后再处理下一批
      await Promise.all(batchPromises);
    }
    return results;
  }
}