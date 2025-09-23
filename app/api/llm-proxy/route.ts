import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, apiBaseUrl, model, messages, ...otherParams } = body;

    // 验证必要参数
    if (!apiKey || !apiBaseUrl || !model || !messages) {
      return NextResponse.json(
        { error: '缺少必要的API参数' },
        { status: 400 }
      );
    }

    // 构建请求URL
    let targetUrl = apiBaseUrl;
    if (!targetUrl.endsWith('/')) {
      targetUrl += '/';
    }
    targetUrl += 'chat/completions';

    // 构建请求体
    const requestBody = {
      model,
      messages,
      ...otherParams
    };

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // 发送请求到LLM服务
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    // 获取响应数据
    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'LLM API请求失败',
          details: responseData,
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      );
    }

    // 返回成功响应
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('LLM proxy error:', error);
    
    // 处理网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          error: '网络连接失败',
          details: '无法连接到LLM服务器，请检查网络连接和API基础URL'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'LLM代理服务内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 支持OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}