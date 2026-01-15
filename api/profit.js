/**
 * Vercel Serverless Function: 利润计算（ChatGPT 代理）
 * 路径: /api/profit
 * 方法: POST
 *
 * 环境变量：
 * - OPENAI_API_KEY: OpenAI 的 API Key
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[profit] OPENAI_API_KEY not found in environment variables');
    return res.status(500).json({
      error: 'Server configuration error: OPENAI_API_KEY not found',
      code: 'CONFIG_ERROR',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON',
      });
    }
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      error: 'Invalid request body',
      code: 'INVALID_BODY',
    });
  }

  const {
    title,
    sourceUrl,
    platform = 'Amazon',
    costPrice, // 进货价，可选
    salePrice, // 售价，可选
    extra, // 其他补充信息，比如类目、渠道等
  } = body;

  if (!title && !sourceUrl) {
    return res.status(400).json({
      error: 'Missing required field: title or sourceUrl',
      code: 'MISSING_FIELDS',
    });
  }

  const userText = [
    `平台: ${platform}`,
    title ? `产品标题: ${title}` : '',
    sourceUrl ? `货源链接: ${sourceUrl}` : '',
    costPrice != null ? `预计进货价(单件): ${costPrice}` : '',
    salePrice != null ? `计划售卖价(单件): ${salePrice}` : '',
    extra ? `补充信息: ${extra}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const payload = {
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content:
          '你是一名电商利润分析顾问，熟悉亚马逊、TikTok Shop 等跨境电商平台。根据给定的产品信息，帮我估算利润结构，并输出：\n' +
          '1）关键成本项拆分（含大致比例或区间）；\n' +
          '2）不同售价场景下的毛利率区间；\n' +
          '3）风险点（如运费、关税、退货、广告、淡旺季等）；\n' +
          '4）给出 2-3 个简短结论和建议。\n' +
          '如果没有具体价格，请做合理假设，并在答案开头明确写出你的假设前提。\n' +
          '用中文回答，结构化分点输出，便于快速抄到笔记里。',
      },
      {
        role: 'user',
        content: userText,
      },
    ],
    temperature: 0.3,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[profit] OpenAI API error:', response.status, data);
      return res.status(response.status).json({
        error: data.error?.message || 'OpenAI API error',
        code: 'API_ERROR',
        status: response.status,
      });
    }

    const content =
      data.choices?.[0]?.message?.content || '（未能获取到模型返回内容）';

    return res.status(200).json({
      success: true,
      analysis: content,
    });
  } catch (error) {
    console.error('[profit] Network or parsing error:', error);
    return res.status(500).json({
      error: 'Failed to communicate with OpenAI API',
      code: 'NETWORK_ERROR',
      message: error.message,
    });
  }
}

