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

  // 调用 DeepSeek API
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
        stream: false
      })
    });

    // 处理响应
    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Unknown error' };
      }

      // 根据状态码返回相应错误
      const status = deepseekResponse.status;
      console.error(`[chat] DeepSeek API error ${status}:`, errorData);

      return res.status(status).json({
        error: errorData.error?.message || errorData.error || 'DeepSeek API error',
        code: status === 401 ? 'UNAUTHORIZED' : status === 429 ? 'RATE_LIMIT' : 'API_ERROR',
        status
      });
    }

    const data = await deepseekResponse.json();
    
    // 提取回复内容
    const reply = data.choices?.[0]?.message?.content || '';
    if (!reply) {
      console.error('[chat] No reply content in DeepSeek response:', data);
      return res.status(500).json({
        error: 'No reply content from DeepSeek',
        code: 'EMPTY_REPLY'
      });
    }

    // 返回成功响应
    return res.status(200).json({
      reply,
      usage: data.usage || null,
      model: data.model || 'deepseek-chat'
    });

  } catch (error) {
    console.error('[chat] Network or parsing error:', error);
    return res.status(500).json({
      error: 'Failed to communicate with DeepSeek API',
      code: 'NETWORK_ERROR',
      message: error.message
    });
  }
}
