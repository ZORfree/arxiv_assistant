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