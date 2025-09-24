import { NextRequest, NextResponse } from 'next/server';
import { ProxyConfigService } from '@/lib/proxy-config';

/**
 * API测试端点
 * 用于测试LLM API连接
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, apiBaseUrl, model, useProxy } = body;

    // 验证必要参数
    if (!apiKey || !apiBaseUrl || !model) {
      return NextResponse.json(
        { 
          success: false,
          message: '缺少必要的API参数' 
        },
        { status: 400 }
      );
    }

    // 如果使用代理模式，检查代理服务是否启用
    if (useProxy && !ProxyConfigService.isLLMProxyEnabled()) {
      return NextResponse.json(
        { 
          success: false,
          message: 'LLM代理服务已禁用，请使用直连模式或联系管理员启用代理服务'
        },
        { status: 403 }
      );
    }

    // 构建测试请求
    const testMessage = {
      role: 'user',
      content: 'Hello, this is a connection test.'
    };

    let response;
    
    if (useProxy) {
      // 使用代理模式测试
      let baseUrl;
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NODE_ENV === 'development') {
        baseUrl = 'http://localhost:3000';
      } else {
        // 生产环境下的回退方案
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        baseUrl = `${protocol}://${host}`;
      }
      
      response = await fetch(`${baseUrl}/api/llm-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey,
          apiBaseUrl,
          model,
          messages: [testMessage],
          max_tokens: 10,
          temperature: 0.1
        })
      });
    } else {
      // 直连模式测试
      const apiUrl = `${apiBaseUrl}/chat/completions`;
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [testMessage],
          max_tokens: 10,
          temperature: 0.1
        })
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false,
          message: `API测试失败: ${response.status} ${response.statusText}`,
          details: errorData.error || errorData.message || '未知错误'
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    
    return NextResponse.json({
      success: true,
      message: `API连接测试成功（${useProxy ? '代理' : '直连'}模式）`,
      details: `模型: ${model}, 响应正常`,
      response: {
        model: responseData.model || model,
        usage: responseData.usage,
        choices: responseData.choices?.length || 0
      }
    });

  } catch (error) {
    console.error('API测试失败:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'API测试失败',
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