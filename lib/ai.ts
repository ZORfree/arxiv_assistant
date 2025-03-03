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
  private static readonly API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL || process.env.OPENAI_API_BASE_URL;
  private static readonly API_MODEL = process.env.NEXT_PUBLIC_OPENAI_MODEL || process.env.OPENAI_MODEL;

  private static validateConfig() {
    if (!this.API_KEY) {
      throw new Error('OpenAI API密钥未配置，请在Vercel项目设置中配置OPENAI_API_KEY');
    }
    if (!this.API_MODEL) {
      throw new Error('OpenAI模型未配置，请在Vercel项目设置中配置OPENAI_MODEL');
    }
    if (!this.API_BASE_URL) {
      throw new Error('OpenAI API基础URL未配置，请在Vercel项目设置中配置OPENAI_API_BASE_URL');
    }
  }

  private static getCacheKey(paper: { title: string; summary: string }): string {
    return `paper_analysis_${btoa(paper.title + paper.summary)}`;
  }

  private static getFromCache(paper: { title: string; summary: string }): PaperAnalysis | null {
    try {
      const cacheKey = this.getCacheKey(paper);
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { analysis, timestamp }: { analysis: PaperAnalysis; timestamp: number } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`[AI] 从缓存中获取论文分析结果：${paper.title}`);
      return analysis;
    } catch (error) {
      console.error('[AI] 读取缓存失败:', error);
      return null;
    }
  }

  private static saveToCache(paper: { title: string; summary: string }, analysis: PaperAnalysis): void {
    try {
      const cacheKey = this.getCacheKey(paper);
      const cacheData = {
        analysis,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`[AI] 已缓存论文分析结果：${paper.title}`);
    } catch (error) {
      console.error('[AI] 保存缓存失败:', error);
    }
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
      this.validateConfig();
      console.log(`[AI] 开始分析论文：${paper.title}`);
      console.log(`[AI] 使用模型：${this.API_MODEL}`);
      
      const prompt = `作为一个AI助手，请基于以下信息分析这篇论文是否与用户相关：

用户信息：
- 职业：${preference.profession}
- 感兴趣的方向：${preference.interests.join(', ')}
- 不感兴趣的方向：${preference.nonInterests.join(', ')}

论文信息：
- 标题：${paper.title}
- 摘要：${paper.summary}
- 分类：${paper.categories.join(', ')}

请分析这篇论文是否与用户的研究方向和兴趣相关，并给出理由，以及完成对标题和摘要进行专业翻译为中文。请返回严格符合JSON格式的内容，不要包含多余的标记或解释，
如：{"titleTrans":string (标题翻译内容),"summaryTrans":string (摘要翻译内容),"isRelevant":boolean (是否相关),"reason": string (原因说明,中文),"score": number (相关度评分，0-100)}`;

      console.log('[AI] 正在调用OpenAI API...');
      const apiUrl = `${this.API_BASE_URL}/chat/completions`;
      const response = await axios.post(apiUrl, {
        model: this.API_MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的学术论文分析助手，擅长根据用户背景分析论文相关性。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const result = JSON.parse(response.data.choices[0].message.content);
      console.log(`[AI] 分析完成，相关度：${result.score}%`);
      
      // 保存到缓存，无论论文是否相关都进行缓存
      this.saveToCache(paper, result);
      
      return result as PaperAnalysis;
    } catch (error) {
      console.error('[AI] 论文分析失败:', error);
      console.error('[AI] API配置信息:', {
        baseUrl: this.API_BASE_URL,
        model: this.API_MODEL,
        hasApiKey: !!this.API_KEY
      });
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