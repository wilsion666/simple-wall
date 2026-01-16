/**
 * Mock Chat API - 用于MVP测试
 * 路径: /api/chat-mock
 * 方法: POST
 * 返回: 模拟流式响应
 */

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 解析请求体
  let body = req.body;
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

  const { messages = [], model = 'gpt-5.2' } = body;

  // 验证消息格式
  if (!messages || messages.length === 0) {
    return res.status(400).json({ 
      error: 'Missing required field: messages',
      code: 'MISSING_MESSAGES'
    });
  }

  // 获取最后一条用户消息
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMessage) {
    return res.status(400).json({ 
      error: 'No user message found',
      code: 'NO_USER_MESSAGE'
    });
  }

  // 模拟不同模型的回复风格
  const modelResponses = {
    'gpt-5.2': `这是来自 GPT-5.2 的回复。\n\n你刚才说："${lastUserMessage.content}"\n\n让我为你分析一下...`,
    'gemini-3': `这是来自 Gemini 3 的回复。\n\n关于"${lastUserMessage.content}"，我的看法是...`,
    'claude': `这是来自 Claude 的回复。\n\n针对"${lastUserMessage.content}"，我建议...`,
    'deepseek-r1': `这是来自 DeepSeek R1 的回复。\n\n你提到的"${lastUserMessage.content}"，我认为...`
  };

  const responseText = modelResponses[model] || modelResponses['gpt-5.2'];

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 模拟流式输出（逐字符发送）
  const words = responseText.split('');
  let index = 0;

  const sendChunk = () => {
    if (index < words.length) {
      const chunk = words[index];
      res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
      index++;
      
      // 模拟打字速度（每50ms发送一个字符）
      setTimeout(sendChunk, 50);
    } else {
      // 发送完成信号
      res.write('data: [DONE]\n\n');
      res.end();
    }
  };

  // 开始发送
  sendChunk();
}
