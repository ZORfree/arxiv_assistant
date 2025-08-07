import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    // 获取请求参数
    const { apiKey, apiBaseUrl, model } = await request.json();

    // 验证参数
    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'API密钥不能为空' }, { status: 400 });
    }
    if (!apiBaseUrl) {
      return NextResponse.json({ success: false, message: 'API基础URL不能为空' }, { status: 400 });
    }
    if (!model) {
      return NextResponse.json({ success: false, message: '模型名称不能为空' }, { status: 400 });
    }

    // 构建简单的测试请求
    const apiUrl = `${apiBaseUrl}/chat/completions`;
    const response = await axios.post(apiUrl, {
      model: model,
      messages: [
        {
          role: 'user',
          content: 'hi'
        }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // 如果请求成功，返回成功信息
    return NextResponse.json({ success: true, message: 'API连接测试成功' });
  } catch (error: any) {
    console.error('[API] 测试连接失败:', error);
    // 返回详细的错误信息
    return NextResponse.json(
      { 
        success: false, 
        message: '连接测试失败', 
        error: error.message,
        details: error.response?.data || '未知错误'
      },
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