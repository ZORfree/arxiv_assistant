import { NextResponse } from 'next/server';
import { ProxyConfigService } from '@/lib/proxy-config';

/**
 * 获取代理服务状态的API端点
 * 用于前端检查代理服务是否可用
 */
export async function GET() {
  try {
    const status = ProxyConfigService.getProxyStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('获取代理状态失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取代理状态失败' 
      },
      { status: 500 }
    );
  }
}