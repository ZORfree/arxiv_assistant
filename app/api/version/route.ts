import { NextResponse } from 'next/server';
import { GitHubAPI } from '@/lib/github';

export async function GET() {
  try {
    const versionInfo = await GitHubAPI.getVersionInfo();
    return NextResponse.json(versionInfo);
  } catch (error) {
    console.error('Error in version API route:', error);
    // 返回默认版本信息而不是错误
    return NextResponse.json({
      latestUpdate: new Date().toISOString(),
      commits: [{
        sha: 'unknown',
        commit: {
          author: {
            name: 'System',
            email: 'system@example.com',
            date: new Date().toISOString()
          },
          message: '版本信息暂时无法获取'
        },
        html_url: '#'
      }]
    });
  }
}