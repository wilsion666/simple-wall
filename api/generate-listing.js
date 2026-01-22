/**
 * Vercel Serverless Function: Gemini Listing 生成 API
 * 路径: /api/generate-listing
 * 方法: POST
 *
 * 使用 Vercel AI Gateway (OpenAI-compatible API)
 * 注意：推荐使用新的 /api/generate-ai-content?promptType=listing
 * 
 * 环境变量：
 * - AI_GATEWAY_API_KEY: Vercel AI Gateway 的 API Key (vck_ 开头)
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 从环境变量读取 Vercel AI Gateway API Key (vck_ 开头)
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    console.error('[generate-listing] ❌ AI_GATEWAY_API_KEY not found in environment variables');
    console.error('[generate-listing] 💡 Please set AI_GATEWAY_API_KEY (vck_ prefix) in Vercel environment variables');
    return res.status(500).json({
      error: 'Server configuration error: AI_GATEWAY_API_KEY not found',
      code: 'CONFIG_ERROR',
    });
  }
  
  // 打印 API Key（脱敏：只显示前4后4）
  const keyPreview = apiKey.length > 8 
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` 
    : '(key too short)';
  console.log(`[generate-listing] 🔑 API Key loaded: ${keyPreview} (length: ${apiKey.length})`);

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

  const { title, imageUrl, asin } = body;

  // 验证必需参数
  if (!title || typeof title !== 'string') {
    return res.status(400).json({
      error: 'Missing required field: title',
      code: 'MISSING_TITLE',
    });
  }

  // imageUrl 可选，因为不是所有产品都有图片
  console.log(`[generate-listing] 📤 Processing ASIN: ${asin || 'N/A'}`);
  console.log(`[generate-listing] 📝 Title: ${title.substring(0, 50)}...`);
  console.log(`[generate-listing] 🖼️  Image URL: ${imageUrl ? 'provided' : 'not provided'}`);

  // 构建提示词（使用新的高转化 SEO 文案专家策略）
  const systemPrompt = `你是一位拥有 10 年经验的亚马逊高级 Listing 专家，擅长将复杂的参数转化为消费者无法拒绝的购买冲动。

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
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
    // 验证图片 URL 格式
    try {
      new URL(imageUrl); // 验证是否为有效 URL
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: imageUrl
        }
      });
      console.log(`[generate-listing] ✅ Image URL added: ${imageUrl.substring(0, 50)}...`);
    } catch (urlError) {
      console.warn(`[generate-listing] ⚠️ Invalid image URL format, skipping image: ${imageUrl}`);
      // 继续执行，不使用图片
    }
  } else {
    console.log(`[generate-listing] ℹ️ No image URL provided, generating text-only listing`);
  }

  // 构建请求体（OpenAI Chat Completions 格式）
  const payload = {
    model: 'google/gemini-3-flash',  // 使用 Vercel AI Gateway 的模型标识
    messages: [
      {
        role: 'user',
        content: messageContent
      }
    ],
    temperature: 0.4
  };

  // 尝试添加 JSON 格式要求（如果支持）
  // 注意：某些 Gateway 版本可能不支持 response_format，先注释掉
  // 如果模型支持，可以在提示词中明确要求 JSON 输出
  // payload.response_format = { type: 'json_object' };

  try {
    console.log(`[generate-listing] 🌐 Request URL: ${url}`);
    console.log(`[generate-listing] 🤖 Model: google/gemini-3-flash`);
    console.log(`[generate-listing] 🔑 Using API Key: ${keyPreview}`);
    console.log(`[generate-listing] 📦 Payload preview:`, {
      model: payload.model,
      messages_count: payload.messages.length,
      message_content_types: payload.messages[0].content.map(c => c.type),
      temperature: payload.temperature
    });
    
    // 使用 Authorization: Bearer <token> header
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[generate-listing] 📥 Response status: ${response.status}`);
    
    const data = await response.json();

    if (!response.ok) {
      console.error('[generate-listing] ❌ API error:', response.status);
      console.error('[generate-listing] Error details:', JSON.stringify(data, null, 2));
      
      // 提取更详细的错误信息
      let errorMessage = 'AI Gateway API error';
      if (data.error) {
        if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (data.error.message) {
          errorMessage = data.error.message;
        } else if (data.error.error) {
          errorMessage = data.error.error;
        }
      }
      
      // 检查 API key 相关错误
      const errorMsg = JSON.stringify(data).toLowerCase();
      if (errorMsg.includes('api key') || 
          errorMsg.includes('unauthorized') ||
          errorMsg.includes('authentication') ||
          errorMsg.includes('invalid api key')) {
        console.error('[generate-listing] 🔐 This appears to be an API key authentication error!');
        console.error('[generate-listing] 💡 Please check:');
        console.error('[generate-listing]    1. AI_GATEWAY_API_KEY is set in Vercel environment variables');
        console.error('[generate-listing]    2. The key starts with "vck_"');
        console.error('[generate-listing]    3. The key is valid and has no extra spaces');
        errorMessage = 'API Key authentication failed. Please check your AI_GATEWAY_API_KEY configuration.';
      } else if (errorMsg.includes('invalid input') || errorMsg.includes('invalid_request')) {
        console.error('[generate-listing] ⚠️ Invalid input error detected');
        console.error('[generate-listing] 💡 Possible causes:');
        console.error('[generate-listing]    1. Model name may not be supported');
        console.error('[generate-listing]    2. Request format may be incorrect');
        console.error('[generate-listing]    3. Image URL may be invalid or inaccessible');
        errorMessage = `Invalid input: ${errorMessage}. Please check the request format and image URL.`;
      }
      
      return res.status(response.status).json({
        error: errorMessage,
        code: 'API_ERROR',
        status: response.status,
        details: data,
      });
    }

    // 提取生成的内容 (OpenAI format)
    const choices = data.choices || [];
    const messageContent = choices[0]?.message?.content;

    if (!messageContent) {
      console.warn('[generate-listing] No content in response');
      return res.status(500).json({
        error: 'No content returned from AI Gateway',
        code: 'NO_CONTENT',
      });
    }

    console.log(`[generate-listing] 📄 Raw content length: ${messageContent.length}`);

    // 解析 JSON
    let listing;
    try {
      listing = JSON.parse(messageContent);
    } catch (e) {
      console.error('[generate-listing] Failed to parse JSON:', e);
      console.error('[generate-listing] Raw content:', messageContent.substring(0, 500));
      return res.status(500).json({
        error: 'Failed to parse AI response as JSON',
        code: 'INVALID_JSON_RESPONSE',
        rawContent: messageContent,
      });
    }

    // 验证 JSON 结构
    if (!listing.product_name_en || !listing.title_en || !Array.isArray(listing.bullets_en)) {
      console.warn('[generate-listing] Invalid JSON structure');
      return res.status(500).json({
        error: 'AI returned invalid JSON structure',
        code: 'INVALID_STRUCTURE',
        listing,
      });
    }

    console.log(`[generate-listing] ✅ Success for ASIN: ${asin || 'N/A'}`);
    
    return res.status(200).json({
      success: true,
      listing,
    });

  } catch (error) {
    console.error('[generate-listing] Network or parsing error:', error);
    return res.status(500).json({
      error: 'Failed to communicate with AI Gateway',
      code: 'NETWORK_ERROR',
      message: error.message,
    });
  }
}
