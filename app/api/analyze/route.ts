import { NextResponse } from 'next/server';
import { UserPreference, PaperAnalysis } from '@/lib/ai';
import axios from 'axios';
import redis from '@/lib/redis';
import { ArxivPaper } from '@/lib/arxiv';
import { ProxyConfigService } from '@/lib/proxy-config';

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

const CACHE_EXPIRY = Number(process.env.NEXT_PUBLIC_CACHE_EXPIRY) || Number(process.env.CACHE_EXPIRY) || 7 * 24 * 60 * 60;


function getCacheKey(paperId: string, userId: string): string {
  return `paper_analysis_${userId}_${paperId}`;
}

export async function POST(request: Request) {
  try {
    // 获取请求参数
    const { paper, userpreference, userId } = await request.json() as {
      paper: ArxivPaper;
      userpreference: UserPreference;
      userId: string;
    };
    // 确保preference对象存在
    const preference = userpreference || {};
    const API_KEY = preference.apiConfig?.apiKey || null;
    const API_BASE_URL = preference.apiConfig?.apiBaseUrl || null;
    const API_MODEL = preference.apiConfig?.model || null;

    if (!API_KEY) {
      throw new Error('OpenAI API密钥未配置');
    }
    if (!API_MODEL) {
      throw new Error('OpenAI模型未配置');
    }
    if (!API_BASE_URL) {
      throw new Error('OpenAI API BASE URL未配置');
    }
    // 尝试从缓存获取
    const cacheKey = getCacheKey(paper.id, userId);
    const cached = await redis.get<PaperAnalysis & { timestamp: number }>(cacheKey);

    if (cached) {
      const { timestamp, ...analysis } = cached;
      console.log(`[Cache] 使用缓存的分析结果：${paper.title}, 缓存时间：${new Date(timestamp).toISOString().replace('T', ' ').slice(0, 19)}`);
      return NextResponse.json(analysis);
    }
    console.log(`[AI] [${new Date().toLocaleString()}] 开始分析论文：${paper.title}`);
    console.log(`[AI] 使用模型：${API_MODEL}`);

    const prompt = `{
      "task": "As an AI assistant, please analyze whether this paper is relevant to the user based on the following user_information and paper_information, provide the reasons and score(0-100), and complete a professional translation of the title and abstract into Chinese.",
      "restriction": "Return the content strictly in JSON format, without any additional tags or explanations, do not to escaping any special characters,like the output given below",
      "user_information": {
          "profession": ${preference.profession},
          "interest": ${preference.interests.join(', ')},
          "disinterest": ${preference.nonInterests.join(', ')}
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

    console.log('[AI] 正在调用OpenAI API...');

    let response;
    const messages = [
      {
        role: 'system',
        content: 'You are a professional academic paper analysis assistant, adept at assessing the relevance of papers based on the user backgrounds'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // 根据用户配置选择直连或代理模式
    if (preference.apiConfig?.useProxy === true) {
      // 检查LLM代理服务是否启用
      if (!ProxyConfigService.isLLMProxyEnabled()) {
        throw new Error('LLM代理服务已禁用，请使用直连模式或联系管理员启用代理服务');
      }

      console.log('[AI] 使用服务器代理模式');
      // 使用内部代理API - 构建完整URL
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');

      response = await axios.post(`${baseUrl}/api/llm-proxy`, {
        apiKey: API_KEY,
        apiBaseUrl: API_BASE_URL,
        model: API_MODEL,
        messages,
        temperature: 0.7
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.log('[AI] 使用直连模式');
      // 直接调用LLM API
      const apiUrl = `${API_BASE_URL}/chat/completions`;
      response = await axios.post(apiUrl, {
        model: API_MODEL,
        messages,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    }

    const aiContent = response.data.choices[0].message.content;
    console.log(`[AI] 收到响应内容 (长度: ${aiContent.length})`);
    
    let result: PaperAnalysis;
    try {
      result = parseAIResponse(aiContent) as PaperAnalysis;
    } catch (parseError) {
      console.error('[AI] 解析响应内容失败!');
      console.error('[AI] 失败的原始内容内容如下:');
      console.error('-----------------------------------');
      console.error(aiContent);
      console.error('-----------------------------------');
      throw new Error(`AI 响应格式解析失败: ${parseError instanceof Error ? parseError.message : '未知原因'}`);
    }

    console.log(`[AI] 分析完成，评分：${result.score}%`);

    // 保存到缓存
    if (CACHE_EXPIRY >= 1) {
      await redis.set(cacheKey, {
        ...result,
        timestamp: Date.now()
      }, { ex: CACHE_EXPIRY });
    } else {
      await redis.set(cacheKey, {
        ...result,
        timestamp: Date.now()
      });
    }


    return NextResponse.json(result);
  } catch (error: unknown) {
    // 详细记录错误堆栈或请求详情
    if (axios.isAxiosError(error)) {
      console.error('[API] LLM 外部调用失败:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
    } else {
      console.error('[API] 内部流程错误:', error);
    }
    
    // 提取更详细的错误信息供前端显示
    let errorMessage = 'Failed to analyze paper';
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status || 500;
      const apiError = error.response?.data?.error;
      
      if (statusCode === 429) {
        errorMessage = 'API 请求过于频繁 (429)，请稍后再试或检查额度';
      } else if (statusCode === 401) {
        errorMessage = 'API 密钥无效 (401)，请检查设置';
      } else if (apiError?.message) {
        errorMessage = `API 错误: ${apiError.message}`;
      } else {
        errorMessage = `LLM 服务返回错误: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}