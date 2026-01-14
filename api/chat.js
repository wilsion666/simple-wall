/**
 * Vercel Serverless Function: DeepSeek 聊天 API 代理
 * 路径: /api/chat
 * 方法: POST
 */

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 获取环境变量中的 API Key
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('[chat] DEEPSEEK_API_KEY not found in environment variables');
    return res.status(500).json({ 
      error: 'Server configuration error: API key not found',
      code: 'CONFIG_ERROR'
    });
  }

  // 解析请求体
  // Vercel Serverless Functions 会自动解析 JSON，直接使用 req.body
  let body = req.body;
  
  // 如果 body 是字符串，尝试解析
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ 
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      });
    }
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ 
      error: 'Invalid request body',
      code: 'INVALID_BODY'
    });
  }

  const { message, messages = [] } = body;

  // 验证输入
  if (!message && (!messages || messages.length === 0)) {
    return res.status(400).json({ 
      error: 'Missing required field: message or messages',
      code: 'MISSING_MESSAGE'
    });
  }

  // 构建消息列表
  // 如果提供了单条 message，转换为 messages 格式
  let conversationMessages = messages;
  if (message && messages.length === 0) {
    conversationMessages = [{ role: 'user', content: message }];
  }

  // 调用 DeepSeek API（流式模式）
  try {
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: conversationMessages,
        stream: true  // ✅ 启用流式响应
      })
    });

    // 处理错误响应
    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Unknown error' };
      }

      const status = deepseekResponse.status;
      console.error(`[chat] DeepSeek API error ${status}:`, errorData);

      return res.status(status).json({
        error: errorData.error?.message || errorData.error || 'DeepSeek API error',
        code: status === 401 ? 'UNAUTHORIZED' : status === 429 ? 'RATE_LIMIT' : 'API_ERROR',
        status
      });
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 流式转发 DeepSeek 的响应
    const reader = deepseekResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // 处理剩余的 buffer
          if (buffer.trim()) {
            const lines = buffer.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  res.write('data: [DONE]\n\n');
                } else {
                  try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta;
                    if (delta?.content) {
                      res.write(`data: ${JSON.stringify({ content: delta.content, done: false })}\n\n`);
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            }
          }
          // 发送完成信号
          res.write('data: [DONE]\n\n');
          res.end();
          break;
        }

        // 解码数据块
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 保留最后一个可能不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim(); // 移除 'data: ' 前缀并去除空白
            
            // 检查是否结束
            if (data === '[DONE]') {
              res.write('data: [DONE]\n\n');
              res.end();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              
              if (delta?.content) {
                // 转发增量内容给前端
                res.write(`data: ${JSON.stringify({ content: delta.content, done: false })}\n\n`);
              }
            } catch (e) {
              // 忽略解析错误，继续处理下一行
              console.warn('[chat] Failed to parse SSE data:', e, 'Data:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    console.error('[chat] Network or parsing error:', error);
    return res.status(500).json({
      error: 'Failed to communicate with DeepSeek API',
      code: 'NETWORK_ERROR',
      message: error.message
    });
  }
}
