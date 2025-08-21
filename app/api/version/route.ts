import { NextResponse } from 'next/server';
import { GitHubAPI } from '@/lib/github';

export async function GET() {
  try {
    const versionInfo = await GitHubAPI.getVersionInfo();
    return NextResponse.json(versionInfo);
  } catch (error) {
    console.error('Error fetching version info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version information' },
      { status: 500 }
    );
  }
}