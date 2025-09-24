import { NextRequest, NextResponse } from 'next/server';
import { ProxyConfigService } from '@/lib/proxy-config';

export async function POST(request: NextRequest) {
  // 检查WebDAV代理服务是否启用
  if (!ProxyConfigService.isWebDAVProxyEnabled()) {
    return NextResponse.json(
      { 
        error: 'WebDAV代理服务已禁用',
        message: '管理员已禁用WebDAV代理服务，请使用直连模式或联系管理员启用代理服务',
        code: 'PROXY_DISABLED'
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { method, url, headers, data, config } = body;

    // 验证必需的参数
    if (!method || !url || !config) {
      return NextResponse.json(
        { error: '缺少必需的参数' },
        { status: 400 }
      );
    }

    // 构建认证头
    const authHeader = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`;

    // 准备请求头
    const requestHeaders: Record<string, string> = {
      'Authorization': authHeader,
      ...headers
    };

    // 构建fetch选项
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: requestHeaders,
    };

    // 如果有数据，添加到请求体
    if (data && (method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PROPFIND')) {
      fetchOptions.body = data;
    }

    // 发送请求到WebDAV服务器
    const response = await fetch(url, fetchOptions);

    // 获取响应数据
    let responseData: string | null = null;
    const contentType = response.headers.get('content-type') || '';
    
    if (response.ok || response.status === 207) {
      if (contentType.includes('text/') || contentType.includes('application/xml')) {
        responseData = await response.text();
      } else {
        responseData = await response.text();
      }
    }

    // 返回响应
    return NextResponse.json({
      success: response.ok || response.status === 201 || response.status === 204 || response.status === 207,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error) {
    console.error('WebDAV proxy error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        status: 500
      },
      { status: 500 }
    );
  }
}

// 支持OPTIONS请求用于CORS预检
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}