import { UserService } from "./user";

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

export class AIService {

  static async analyzePaper(paper: {
    title: string;
    summary: string;
    categories: string[];
  }, preference: UserPreference): Promise<PaperAnalysis> {
    try {
      const userId = UserService.getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paper, preference, userId })
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
    title: string;
    summary: string;
    categories: string[];
  }>, preference: UserPreference): Promise<PaperAnalysis[]> {
    const results: PaperAnalysis[] = [];
    
    for (const paper of papers) {
      try {
        const analysis = await this.analyzePaper(paper, preference);
        results.push(analysis);
      } catch (error) {
        console.error(`[AI] 批量分析论文失败:`, error);
        results.push({
          isRelevant: false,
          reason: '分析失败',
          score: 0,
          titleTrans: '',
          summaryTrans: ''
        });
      }
    }

    return results;
  }
}