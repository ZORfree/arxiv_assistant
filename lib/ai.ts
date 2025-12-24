import { UserService } from "./user";
import { ProxyStatusService } from "./proxy-status";

// 兼容处理大模型返回的各种JSON格式
function parseAIResponse(content: string): PaperAnalysis {
  // 移除换行符和转义字符处理
  content = content.replace(/[\n\n]+/g, '').replace(/\\/g, '\\\\');
  
  // 移除可能的<think>思考内容</think>
  content = content.replace(/<think>.*?<\/think>/gi, '');
  
  // 兼容以"json"开头的情况（可能有多个空格）
  // 匹配 "json" 或 "json " 或 "json  " 等情况
  content = content.replace(/^json\s*/i, '');
  
  // 移除可能的markdown代码块标记
  content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  
  // 清理前后空白字符
  content = content.trim();
  
  // 尝试解析JSON
  let parsedContent = JSON.parse(content);
  
  // 检查是否被包装在output字段中
  if (parsedContent && typeof parsedContent === 'object' && parsedContent.output) {
    // 如果output是字符串，尝试再次解析
    if (typeof parsedContent.output === 'string') {
      try {
        parsedContent = JSON.parse(parsedContent.output);
      } catch {
        // 如果解析失败，直接使用output的值
        parsedContent = parsedContent.output;
      }
    } else {
      // 如果output已经是对象，直接使用
      parsedContent = parsedContent.output;
    }
  }
  
  return parsedContent;
}

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

      // 根据用户偏好直接决定模式，不再进行前端预检
      const shouldUseProxy = userpreference.apiConfig.useProxy === true;
      
      if (shouldUseProxy) {
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

        const resultData = await response.json().catch(() => ({}));

        if (!response.ok) {
          // 如果后端返回了错误信息（如“代理已禁用”），直接抛给UI显示
          throw new Error(resultData.error || `HTTP ${response.status}: Failed to analyze paper`);
        }

        return resultData as PaperAnalysis;
      } else {
        console.log('[AI] 使用直连模式');
        // 直连模式：前端直接调用LLM API
        return await this.analyzeDirectly(paper, userpreference);
      }
    } catch (error) {
      console.error('[AI] 论文分析失败:', error);
      throw error;
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

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[AI] 直连 API 调用失败:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      });
      const apiError = responseData.error?.message || JSON.stringify(responseData);
      if (response.status === 429) {
        throw new Error('API 请求频率超限 (429)，请稍后再试或检查额度');
      }
      throw new Error(`LLM API 调用失败 (${response.status}): ${apiError}`);
    }
    
    const aiContent = responseData.choices[0].message.content;
    console.log(`[AI] 直连收到响应内容 (长度: ${aiContent.length})`);

    try {
      const result = parseAIResponse(aiContent) as PaperAnalysis;
      console.log(`[AI] 直连分析完成，相关度：${result.score}%`);
      return result;
    } catch (parseError) {
      console.error('[AI] 直连解析响应内容失败!');
      console.error('[AI] 原始响应内容:', aiContent);
      throw new Error(`AI 响应格式解析失败: ${parseError instanceof Error ? parseError.message : '未知原因'}`);
    }
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
  
    const queue = papers.map((paper, index) => ({ paper, index }));
    
    while (queue.length > 0) {
      const batch = queue.splice(0, maxConcurrent);
      const batchPromises = batch.map(({ paper, index }) =>
        this.analyzePaper(paper, preference)
          .then(result => {
            results[index] = result;
          })
          .catch((error) => {
            results[index] = {
              isRelevant: false,
              reason: error instanceof Error ? error.message : '分析失败',
              score: 0,
              titleTrans: '',
              summaryTrans: ''
            };
          })
      );
      
      // 等待当前批次的所有请求完成后再处理下一批
      await Promise.all(batchPromises);
    }
    return results;
  }
}