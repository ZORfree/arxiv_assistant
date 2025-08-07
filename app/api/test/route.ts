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
    await axios.post(apiUrl, {
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
    
    // 获取详细的错误信息
    let errorMessage = '连接测试失败';
    let errorDetails = '未知错误';
    
    // 处理不同类型的错误
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      errorMessage = `API返回错误状态码: ${status}`;
      
      // 尝试获取API返回的详细错误信息
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorDetails = error.response.data;
        } else if (typeof error.response.data === 'object') {
          // 处理常见的API错误格式
          if (error.response.data.error) {
            if (typeof error.response.data.error === 'string') {
              errorDetails = error.response.data.error;
            } else if (error.response.data.error.message) {
              errorDetails = error.response.data.error.message;
            }
          } else if (error.response.data.message) {
            errorDetails = error.response.data.message;
          } else {
            errorDetails = JSON.stringify(error.response.data);
          }
        }
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '无法连接到API服务器';
      errorDetails = '请检查API基础URL是否正确，以及网络连接是否正常';
    } else {
      // 设置请求时发生错误
      errorMessage = '请求设置错误';
      errorDetails = error.message || '未知错误';
    }
    
    // 返回详细的错误信息
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: error.message,
        details: errorDetails
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