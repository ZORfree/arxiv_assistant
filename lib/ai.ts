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
    useProxy?: boolean; // 新增：是否使用服务器代理，默认false（直连）
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

      // 根据用户配置选择直连或代理模式
      if (userpreference.apiConfig.useProxy === true) {
        console.log('[AI] 使用服务器代理模式');
        // 代理模式：通过服务器API
        const response = await fetch('/api/analyze', {
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to analyze paper: ${response.status} ${response.statusText}. ${errorData.error || ''}`);
        }

        const result = await response.json();
        return result as PaperAnalysis;
      } else {
        console.log('[AI] 使用直连模式');
        // 直连模式：前端直接调用LLM API
        return await this.analyzeDirectly(paper, userpreference);
      }
    } catch (error) {
      console.error('[AI] 论文分析失败:', error);
      throw new Error('Failed to analyze paper with AI');
    }
  }

  // 新增：直连模式的分析方法
  private static async analyzeDirectly(paper: {
    link: string;
    id: string;
    title: string;
    summary: string;
    categories: string[];
  }, userpreference: UserPreference): Promise<PaperAnalysis> {
    const { apiKey, apiBaseUrl, model } = userpreference.apiConfig!;

    // 检查缓存（暂时禁用）
    // const cached = await this.getFromCache();
    // if (cached) {
    //   console.log(`[Cache] 使用缓存的分析结果：${paper.title}`);
    //   return cached;
    // }

    // 构建提示词
    const prompt = `{
      "task": "As an AI assistant, please analyze whether this paper is relevant to the user based on the following user_information and paper_information, provide the reasons and score(0-100), and complete a professional translation of the title and abstract into Chinese.",
      "restriction": "Return the content strictly in JSON format, without any additional tags or explanations, do not to escaping any special characters,like the output given below",
      "user_information": {
          "profession": ${userpreference.profession},
          "interest": ${userpreference.interests.join(', ')},
          "disinterest": ${userpreference.nonInterests.join(', ')}
      },
      "paper_information": {
          "title": ${paper.title.replace(/[\r\n]+/g, '')},
          "abstract": ${paper.summary.replace(/[\r\n]+/g, '')},
          "category": ${paper.categories.join(', ')}
      },
      "output": {
          "titleTrans": "Chinese translation of title",
          "summaryTrans": "Chinese translation of summary",
          "isRelevant": "The correlation you give, needs to be the boolean type",
          "reason": "Your provide reasons",
          "score": "The score you give, needs to be the int type"
      }
    }`;

    // 直接调用LLM API
    const apiUrl = `${apiBaseUrl}/chat/completions`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional academic paper analysis assistant, adept at assessing the relevance of papers based on the user backgrounds'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`LLM API调用失败: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    const result = JSON.parse(responseData.choices[0].message.content.replace(/[\r\n]+/g, '').replace(/\\/g, '\\\\')) as PaperAnalysis;
    
    console.log(`[AI] 直连分析完成，相关度：${result.score}%`);
    
    // 保存到缓存（暂时禁用）
    // await this.saveToCache();
    
    return result;
  }

  // 缓存辅助方法（简化版，实际项目中可能需要更复杂的实现）
  private static async getFromCache(): Promise<PaperAnalysis | null> {
    try {
      // 这里应该调用实际的缓存服务，暂时返回null
      return null;
    } catch {
      return null;
    }
  }

  private static async saveToCache(): Promise<void> {
    try {
      // 这里应该调用实际的缓存服务
      // 暂时不实现具体逻辑
    } catch (error) {
      console.warn('[Cache] 缓存保存失败:', error);
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