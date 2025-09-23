import { NextRequest, NextResponse } from 'next/server';
import { SmartWebDAVClient } from '../../../../lib/webdav-smart';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    // 验证必需的参数
    if (!config || !config.url || !config.username || !config.password) {
      return NextResponse.json(
        { error: '缺少必需的WebDAV配置参数' },
        { status: 400 }
      );
    }

    // 创建智能WebDAV客户端并检测最佳连接方式
    const client = new SmartWebDAVClient(config);
    const result = await client.detectBestConnectionMode();

    return NextResponse.json(result);

  } catch (error) {
    console.error('WebDAV detection error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        recommendedMode: 'proxy',
        recommendation: '检测过程中出现错误，建议使用服务器代理模式'
      },
      { status: 500 }
    );
  }
}

// 支持OPTIONS请求用于CORS预检
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}