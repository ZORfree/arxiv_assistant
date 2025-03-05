import { NextResponse } from 'next/server';
import { AIService } from '@/lib/ai';
import { UserPreference, PaperAnalysis } from '@/lib/ai';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { paper, preference } = await request.json() as {
      paper: {
        title: string;
        summary: string;
        categories: string[];
      };
      preference: UserPreference;
    };

    // 验证环境变量
    const API_KEY = process.env.OPENAI_API_KEY;
    const API_BASE_URL = process.env.OPENAI_API_BASE_URL;
    const API_MODEL = process.env.OPENAI_MODEL;

    if (!API_KEY) {
      throw new Error('OpenAI API密钥未配置，请在Vercel项目设置中配置OPENAI_API_KEY');
    }
    if (!API_MODEL) {
      throw new Error('OpenAI模型未配置，请在Vercel项目设置中配置OPENAI_MODEL');
    }
    if (!API_BASE_URL) {
      throw new Error('OpenAI API基础URL未配置，请在Vercel项目设置中配置OPENAI_API_BASE_URL');
    }

    console.log(`[AI] 开始分析论文：${paper.title}`);
    console.log(`[AI] 使用模型：${API_MODEL}`);
    
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
    const apiUrl = `${API_BASE_URL}/chat/completions`;
    const response = await axios.post(apiUrl, {
      model: API_MODEL,
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
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = JSON.parse(response.data.choices[0].message.content);
    console.log(`[AI] 分析完成，相关度：${result.score}%`);
    
    return NextResponse.json(result as PaperAnalysis);
  } catch (error) {
    console.error('[API] 论文分析失败:', error);
    return NextResponse.json(
      { error: 'Failed to analyze paper' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}