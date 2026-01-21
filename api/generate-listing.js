/**
 * Vercel Serverless Function: Gemini Listing 生成 API
 * 路径: /api/generate-listing
 * 方法: POST
 *
 * 环境变量：
 * - AI_GATEWAY_API_KEY: Vercel AI Gateway 的 API Key
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.gemini3propreview;
  if (!apiKey) {
    console.error('[generate-listing] ❌ gemini3propreview not found in environment variables');
    console.error('[generate-listing] Available env keys:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY') || k.includes('gemini')));
    return res.status(500).json({
      error: 'Server configuration error: gemini3propreview not found',
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

  if (!imageUrl || typeof imageUrl !== 'string') {
    return res.status(400).json({
      error: 'Missing required field: imageUrl',
      code: 'MISSING_IMAGE_URL',
    });
  }

  // 构建提示词
  const systemPrompt = `假如你是一位资深亚马逊美国站Listing文案专家，
擅长仅依据【输入标题】与【输入主图】提取真实信息并输出合规文案。

【任务】
根据标题+主图生成：产品名、英文标题、中文标题、5条英文五点（不要和原标题重复）。

【要求】
1) 只能用标题/主图能确定的信息；不确定必须写入 assumptions（含依据）。
2) 合规：不用emoji/符号花样；不写"best/perfect/guaranteed"等夸张词；不虚构尺寸/材质/数量。
3) 英文Title ≤ 180字符；每条Bullet ≤ 180字符；Bullet写法：Feature → Benefit → Use case。
4) 输出必须为严格JSON，不要额外解释，不要Markdown。

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

  // Google Gemini 官方 API URL
  const modelName = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  
  // 构建请求体（Google Gemini API 格式）
  const payload = {
    contents: [
      {
        parts: [
          {
            text: systemPrompt + `\n\n【输入标题】\n${title}`
          },
          {
            // 使用图片 URL
            inline_data: {
              mime_type: 'image/jpeg',
              data: await fetchImageAsBase64(imageUrl)
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json'
    }
  };

  try {
    console.log(`[generate-listing] 📤 Processing ASIN: ${asin || 'N/A'}`);
    console.log(`[generate-listing] 🌐 Request URL: ${url}?key=****`);
    console.log(`[generate-listing] 🤖 Model: ${modelName}`);
    console.log(`[generate-listing] 🔑 API Key: ${keyPreview}`);
    
    // Google 官方 API 使用 URL 参数传递 key（不是 Bearer token）
    const response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[generate-listing] 📥 Response status: ${response.status}`);
    
    const data = await response.json();

    if (!response.ok) {
      console.error('[generate-listing] ❌ API error:', response.status);
      console.error('[generate-listing] Error details:', JSON.stringify(data, null, 2));
      
      // 特别检查 API key 相关错误
      const errorMsg = data.error?.message || JSON.stringify(data);
      if (errorMsg.toLowerCase().includes('api key') || errorMsg.toLowerCase().includes('unauthorized')) {
        console.error('[generate-listing] 🔐 This appears to be an API key authentication error!');
        console.error('[generate-listing] 💡 Please check:');
        console.error('[generate-listing]    1. AI_GATEWAY_API_KEY is set in Vercel environment variables');
        console.error('[generate-listing]    2. The key value is correct (check for extra spaces)');
        console.error('[generate-listing]    3. The gateway URL includes your correct account ID and gateway ID');
      }
      
      return res.status(response.status).json({
        error: data.error?.message || 'AI Gateway API error',
        code: 'API_ERROR',
        status: response.status,
        details: data,
      });
    }

    // 提取生成的内容
    const candidates = data.candidates || [];
    const parts = candidates[0]?.content?.parts || [];
    const textContent = parts[0]?.text;

    if (!textContent) {
      console.warn('[generate-listing] No text content in response');
      return res.status(500).json({
        error: 'No content returned from Gemini',
        code: 'NO_CONTENT',
      });
    }

    // 解析 JSON
    let listing;
    try {
      listing = JSON.parse(textContent);
    } catch (e) {
      console.error('[generate-listing] Failed to parse JSON:', e);
      return res.status(500).json({
        error: 'Failed to parse AI response as JSON',
        code: 'INVALID_JSON_RESPONSE',
        rawContent: textContent,
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

    console.log(`[generate-listing] Success for ASIN: ${asin || 'N/A'}`);
    
    return res.status(200).json({
      success: true,
      listing,
    });

  } catch (error) {
    console.error('[generate-listing] Network or parsing error:', error);
    return res.status(500).json({
      error: 'Failed to communicate with Gemini API',
      code: 'NETWORK_ERROR',
      message: error.message,
    });
  }
}

/**
 * 获取图片并转换为 base64
 * @param {string} imageUrl - 图片 URL
 * @returns {Promise<string>} base64 编码的图片数据
 */
async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error('[fetchImageAsBase64] Error:', error);
    throw new Error(`Failed to fetch and encode image: ${error.message}`);
  }
}
