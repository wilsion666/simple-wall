/**
 * Vercel Serverless Function: 图片生成（Gemini API 代理）
 * 路径: /api/generate-image
 * 方法: POST
 *
 * 环境变量：
 * - GEMINI_API_KEY: Google Gemini 的 API Key
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[generate-image] GEMINI_API_KEY not found in environment variables');
    return res.status(500).json({
      error: 'Server configuration error: GEMINI_API_KEY not found',
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

  const { prompt, aspectRatio = '1:1', imageSize = '1024x1024' } = body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      error: 'Missing required field: prompt',
      code: 'MISSING_PROMPT',
    });
  }

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  };

  try {
    const response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[generate-image] Gemini API error:', response.status, data);
      return res.status(response.status).json({
        error: data.error?.message || 'Gemini API error',
        code: 'API_ERROR',
        status: response.status,
      });
    }

    // 提取第一张图片（base64）
    const candidates = data.candidates || [];
    const parts = candidates[0]?.content?.parts || [];
    const inlinePart = parts.find((p) => p.inlineData && p.inlineData.data);
    const base64 = inlinePart?.inlineData?.data;
    const mimeType = inlinePart?.inlineData?.mimeType || 'image/png';

    if (!base64) {
      console.warn('[generate-image] No inlineData image found in response');
      return res.status(500).json({
        error: 'No image data returned from Gemini',
        code: 'NO_IMAGE_DATA',
      });
    }

    // 返回 data URL 方便前端直接展示
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return res.status(200).json({
      success: true,
      imageDataUrl: dataUrl,
    });
  } catch (error) {
    console.error('[generate-image] Network or parsing error:', error);
    return res.status(500).json({
      error: 'Failed to communicate with Gemini API',
      code: 'NETWORK_ERROR',
      message: error.message,
    });
  }
}

