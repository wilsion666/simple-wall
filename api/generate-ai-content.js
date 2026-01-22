/**
 * Vercel Serverless Function: 通用 AI 内容生成 API
 * 路径: /api/generate-ai-content
 * 方法: POST
 *
 * 使用 Vercel AI Gateway (OpenAI-compatible API)
 * 支持三种提示词类型：
 * - listing: 生成 Listing（高转化 SEO 文案专家）
 * - imagePlan: 生成图片方案（视觉营销总监 & 摄影指导）
 * - productAnalysis: 产品分析（资深市场洞察 & 产品策略师）
 * 
 * 环境变量：
 * - AI_GATEWAY_API_KEY: Vercel AI Gateway 的 API Key (vck_ 开头)
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 从环境变量读取 Vercel AI Gateway API Key
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    console.error('[generate-ai-content] ❌ AI_GATEWAY_API_KEY not found in environment variables');
    return res.status(500).json({
      error: 'Server configuration error: AI_GATEWAY_API_KEY not found',
      code: 'CONFIG_ERROR',
    });
  }
  
  // 打印 API Key（脱敏）
  const keyPreview = apiKey.length > 8 
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` 
    : '(key too short)';
  console.log(`[generate-ai-content] 🔑 API Key loaded: ${keyPreview}`);

  // 解析请求体
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

  const { promptType, title, imageUrl, asin } = body;

  // 验证必需参数
  if (!promptType || !['listing', 'imagePlan', 'productAnalysis'].includes(promptType)) {
    return res.status(400).json({
      error: 'Invalid promptType. Must be one of: listing, imagePlan, productAnalysis',
      code: 'INVALID_PROMPT_TYPE',
    });
  }

  if (!title || typeof title !== 'string') {
    return res.status(400).json({
      error: 'Missing required field: title',
      code: 'MISSING_TITLE',
    });
  }

  console.log(`[generate-ai-content] 📤 Processing ASIN: ${asin || 'N/A'}, Type: ${promptType}`);
  console.log(`[generate-ai-content] 📝 Title: ${title.substring(0, 50)}...`);
  console.log(`[generate-ai-content] 🖼️  Image URL: ${imageUrl ? 'provided' : 'not provided'}`);

  // 根据 promptType 获取对应的提示词
  const systemPrompt = getSystemPrompt(promptType);

  // Vercel AI Gateway URL (OpenAI-compatible)
  const url = 'https://ai-gateway.vercel.sh/v1/chat/completions';
  
  // 构建消息内容
  const messageContent = [
    {
      type: 'text',
      text: systemPrompt + `\n\n【输入标题】\n${title}`
    }
  ];

  // 如果有图片URL，添加图片内容
  if (imageUrl && typeof imageUrl === 'string') {
    messageContent.push({
      type: 'image_url',
      image_url: {
        url: imageUrl
      }
    });
  }

  // 构建请求体（OpenAI Chat Completions 格式）
  const payload = {
    model: 'google/gemini-3-flash',
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' }
  };

  try {
    console.log(`[generate-ai-content] 🌐 Request URL: ${url}`);
    console.log(`[generate-ai-content] 🤖 Model: google/gemini-3-flash`);
    console.log(`[generate-ai-content] 🔑 Using API Key: ${keyPreview}`);
    
    // 使用 Authorization: Bearer <token> header
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[generate-ai-content] 📥 Response status: ${response.status}`);
    
    const data = await response.json();

    if (!response.ok) {
      console.error('[generate-ai-content] ❌ API error:', response.status);
      console.error('[generate-ai-content] Error details:', JSON.stringify(data, null, 2));
      
      return res.status(response.status).json({
        error: data.error?.message || 'AI Gateway API error',
        code: 'API_ERROR',
        status: response.status,
        details: data,
      });
    }

    // 提取生成的内容 (OpenAI format)
    const choices = data.choices || [];
    const messageContentResult = choices[0]?.message?.content;

    if (!messageContentResult) {
      console.warn('[generate-ai-content] No content in response');
      return res.status(500).json({
        error: 'No content returned from AI Gateway',
        code: 'NO_CONTENT',
      });
    }

    console.log(`[generate-ai-content] 📄 Raw content length: ${messageContentResult.length}`);

    // 解析 JSON
    let result;
    try {
      result = JSON.parse(messageContentResult);
    } catch (e) {
      console.error('[generate-ai-content] Failed to parse JSON:', e);
      console.error('[generate-ai-content] Raw content:', messageContentResult.substring(0, 500));
      return res.status(500).json({
        error: 'Failed to parse AI response as JSON',
        code: 'INVALID_JSON_RESPONSE',
        rawContent: messageContentResult,
      });
    }

    console.log(`[generate-ai-content] ✅ Success for ASIN: ${asin || 'N/A'}, Type: ${promptType}`);
    
    return res.status(200).json({
      success: true,
      promptType,
      data: result,
    });

  } catch (error) {
    console.error('[generate-ai-content] Network or parsing error:', error);
    return res.status(500).json({
      error: 'Failed to communicate with AI Gateway',
      code: 'NETWORK_ERROR',
      message: error.message,
    });
  }
}

/**
 * 根据 promptType 获取对应的系统提示词
 */
function getSystemPrompt(promptType) {
  switch (promptType) {
    case 'listing':
      return `你是一位拥有 10 年经验的亚马逊高级 Listing 专家，擅长将复杂的参数转化为消费者无法拒绝的购买冲动。

【任务逻辑】
1. 品类锚点：从图中提取核心产品名，并识别 3 个权重最高的搜索关键词。
2. 拒绝平庸：严禁使用如 "revolutionary, high-quality, must-have" 等空洞的 AI 常用词。请使用生活化、具体的动词（如：由 "keep you warm" 改为 "blocks biting wind"）。
3. 卖点梳理：提炼 5 个差异化卖点。每个卖点必须遵循：[核心利益点大写] + [功能实现方式] + [用户获得的情感/实际收益]。
4. 未满足需求：洞察目前同类产品差评中提到的 2 个致命伤，并在文案中隐性说明本项目已解决该问题。

【输出要求】
- 地道美式英语，符合亚马逊合规标准
- 输出必须为严格JSON格式，不要额外解释，不要Markdown代码块

【输出JSON结构】
{
  "product_name_en": "",
  "product_name_cn": "",
  "title_en": "",
  "title_cn": "",
  "bullets_en": ["", "", "", "", ""],
  "assumptions": [
    {"item": "", "reason": "evidence from title or image"}
  ]
}`;

    case 'imagePlan':
      return `你是一位电商视觉营销总监，擅长通过7张主图构建完整的销售漏斗。

【视觉指导原则】

1. 风格统筹：
根据产品调性设定一个视觉基调（例如："户外硬核"、"都市极简"或"温馨家居"）。

2. 7张图策划：
- Main Image (主图)：3D渲染感，光影强调材质细节，强调点击欲望。
- Size Guide (尺寸指南)：严禁只放数字，应将产品与手机、水瓶或人手进行对比。
- Feature Focus (Left-Right) (功能焦点 - 左右布局)：左侧展示简洁的功能关键词，右侧展示产品局部细节放大。
- Lifestyle Scene (生活场景图)：描述一个具体的美国中产家庭或户外使用场景，以触发用户的情绪联结。
- Comparison/Pain Point (对比/痛点图)：展示"本项目解决方案"与"传统同类产品缺点"的直观对比。
- Detailed Spec (详细规格图)：以图标化形式展示技术参数。
- Gift/Trust (礼品/信任图)：展示产品包装或售后承诺，以降低下单焦虑。

【输出要求】
- 输出必须为严格JSON格式，不要额外解释，不要Markdown代码块
- 以表格形式输出，包含：图片序号、视觉重心、文字排版建议、触发的消费心理

【输出JSON结构】
{
  "visual_style": "",
  "images": [
    {
      "index": 1,
      "type": "Main Image",
      "visual_focus": "",
      "text_layout": "",
      "consumer_psychology": ""
    }
  ]
}`;

    case 'productAnalysis':
      return `你是一位深耕美国市场的资深营销洞察专家，能够一眼看出产品在当前竞争格局下的机会点。

【分析维度】

1. 深度用户画像：
用表格描述3类典型用户：他们的痛点是什么？他们在什么特定的美国生活场景下会急需此产品？

2. 竞品缺口洞察：
基于图片显示的工艺和功能，分析相比Top 3竞品，该产品的优势和致命短板各是什么？

3. 产品机会清单：
- 痛点转化：将收集到的用户吐槽转化为具体的、具有差异化的产品需求点。
- 优先级路线图：按"开发成本"与"市场溢价空间"两个维度，列出改进优先级。

【输出要求】
- 逻辑必须严密。不要说"提升质量"，要说"将接口由塑料改为不锈钢，增加200%耐用度"
- 输出必须为严格JSON格式，不要额外解释，不要Markdown代码块

【输出JSON结构】
{
  "user_profiles": [
    {
      "type": "",
      "pain_points": [],
      "usage_scenarios": []
    }
  ],
  "competitor_analysis": {
    "advantages": [],
    "fatal_flaws": []
  },
  "opportunity_roadmap": [
    {
      "pain_point": "",
      "product_requirement": "",
      "development_cost": "low|medium|high",
      "market_premium": "low|medium|high",
      "priority": "high|medium|low"
    }
  ]
}`;

    default:
      throw new Error(`Unknown promptType: ${promptType}`);
  }
}
