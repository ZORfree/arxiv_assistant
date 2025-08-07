import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

// 定义错误响应的接口
interface ErrorResponse {
  error?: string | { message?: string };
  message?: string;
  [key: string]: unknown;
}

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
  } catch (error) {
    // 将错误转换为AxiosError类型
    const axiosError = error as AxiosError<ErrorResponse>;
    console.error('[API] 测试连接失败:', axiosError);
    
    // 获取详细的错误信息
    let errorMessage = '连接测试失败';
    let errorDetails = '未知错误';
    
    // 处理不同类型的错误
    if (axiosError.response) {
      // 服务器返回了错误状态码
      const status = axiosError.response.status;
      errorMessage = `API返回错误状态码: ${status}`;
      
      // 尝试获取API返回的详细错误信息
      if (axiosError.response.data) {
        if (typeof axiosError.response.data === 'string') {
          errorDetails = axiosError.response.data;
        } else if (typeof axiosError.response.data === 'object') {
          // 处理常见的API错误格式
          if (axiosError.response.data.error) {
            if (typeof axiosError.response.data.error === 'string') {
              errorDetails = axiosError.response.data.error;
            } else if (axiosError.response.data.error.message) {
              errorDetails = axiosError.response.data.error.message;
            }
          } else if (axiosError.response.data.message) {
            errorDetails = axiosError.response.data.message;
          } else {
            errorDetails = JSON.stringify(axiosError.response.data);
          }
        }
      }
    } else if (axiosError.request) {
      // 请求已发送但没有收到响应
      errorMessage = '无法连接到API服务器';
      errorDetails = '请检查API基础URL是否正确，以及网络连接是否正常';
    } else {
      // 设置请求时发生错误
      errorMessage = '请求设置错误';
      errorDetails = axiosError.message || '未知错误';
    }
    
    // 返回详细的错误信息
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: axiosError.message,
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