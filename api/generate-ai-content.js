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

  // 检查是否启用流式输出
  const stream = body.stream !== false; // 默认启用流式

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
    stream: stream, // 启用流式响应
    // 注意：流式模式下，response_format 可能不被支持，我们在提示词中要求 JSON
  };

  try {
    console.log(`[generate-ai-content] 🌐 Request URL: ${url}`);
    console.log(`[generate-ai-content] 🤖 Model: google/gemini-3-flash`);
    console.log(`[generate-ai-content] 🔑 Using API Key: ${keyPreview}`);
    console.log(`[generate-ai-content] 📡 Stream mode: ${stream}`);
    
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[generate-ai-content] ❌ API error:', response.status);
      console.error('[generate-ai-content] Error details:', JSON.stringify(errorData, null, 2));
      
      return res.status(response.status).json({
        error: errorData.error?.message || 'AI Gateway API error',
        code: 'API_ERROR',
        status: response.status,
        details: errorData,
      });
    }

    // 流式响应处理
    if (stream) {
      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 流式转发 AI Gateway 的响应
      const reader = response.body.getReader();
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
          buffer = lines.pop() || ''; // 保留最后一行（可能不完整）

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                res.write('data: [DONE]\n\n');
                res.end();
                return;
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
      } catch (streamError) {
        console.error('[generate-ai-content] Stream error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message, done: true })}\n\n`);
        res.end();
      }
    } else {
      // 非流式响应（保持向后兼容）
      const data = await response.json();

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
    }

  } catch (error) {
    console.error('[generate-ai-content] Network or parsing error:', error);
    if (stream && !res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
      res.end();
    } else {
      return res.status(500).json({
        error: 'Failed to communicate with AI Gateway',
        code: 'NETWORK_ERROR',
        message: error.message,
      });
    }
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
      return `你是一位电商视觉营销总监 & 摄影指导，擅长通过7张主图构建完整的销售漏斗。

【视觉指导原则】

1. 风格统筹：
根据产品调性设定一个视觉基调（例如："户外硬核"、"都市极简"或"温馨家居"）。要求视觉一致性，确保7张图风格统一，形成完整的视觉叙事。

2. 7张图策划（每张图都要有明确的心理预期目标）：

- Main Image (主图 - 第1张)：
  * 视觉重心：3D渲染感，光影强调材质细节，强调点击欲望
  * 文字排版：产品名称 + 核心卖点（不超过3个词）
  * 消费心理：触发"这就是我要的"的即时识别感

- Size Guide (尺寸指南 - 第2张)：
  * 视觉重心：严禁只放数字，应将产品与手机、水瓶或人手进行对比，让用户直观理解尺寸
  * 文字排版：尺寸标注 + 对比说明（如"约等于iPhone 14大小"）
  * 消费心理：消除"尺寸不确定"的购买障碍

- Feature Focus (功能焦点 - 第3张，左右布局)：
  * 视觉重心：左侧展示简洁的功能关键词（3-5个），右侧展示产品局部细节放大
  * 文字排版：关键词用大号字体，细节图配小字说明
  * 消费心理：快速传达核心功能，建立"功能强大"的认知

- Lifestyle Scene (生活场景图 - 第4张)：
  * 视觉重心：描述一个具体的美国中产家庭或户外使用场景，真实感强
  * 文字排版：场景描述文字（如"周末露营必备"）
  * 消费心理：触发用户的情绪联结，让用户想象自己使用产品的场景

- Comparison/Pain Point (对比/痛点图 - 第5张)：
  * 视觉重心：展示"本项目解决方案"与"传统同类产品缺点"的直观对比（左右或上下布局）
  * 文字排版：左侧"传统产品问题"，右侧"我们的解决方案"
  * 消费心理：强化差异化优势，让用户意识到"这个产品解决了我的痛点"

- Detailed Spec (详细规格图 - 第6张)：
  * 视觉重心：以图标化形式展示技术参数，清晰易读
  * 文字排版：参数名称 + 数值 + 图标
  * 消费心理：满足"技术控"用户的信息需求，建立专业信任

- Gift/Trust (礼品/信任图 - 第7张)：
  * 视觉重心：展示产品包装或售后承诺（如"30天无理由退货"）
  * 文字排版：信任标识 + 售后保障文字
  * 消费心理：降低下单焦虑，消除"买错怎么办"的顾虑

【输出要求】
- 输出必须为严格JSON格式，不要额外解释，不要Markdown代码块
- 每张图的描述要具体、可执行，避免空泛的描述
- 确保7张图形成完整的销售漏斗：吸引注意 → 消除疑虑 → 展示功能 → 情感共鸣 → 对比优势 → 技术信任 → 降低风险

【输出JSON结构】
{
  "visual_style": "根据产品调性设定的视觉基调（如：户外硬核/都市极简/温馨家居）",
  "images": [
    {
      "index": 1,
      "type": "Main Image",
      "visual_focus": "具体的视觉描述，如：白色背景，产品居中，3D渲染，强调材质纹理",
      "text_layout": "具体的文字排版建议，如：左上角产品名称，右下角核心卖点",
      "consumer_psychology": "触发的消费心理，如：即时识别感，点击欲望"
    }
  ]
}`;

    case 'productAnalysis':
      return `你是一位深耕美国市场的资深市场洞察 & 产品策略师，能够一眼看出产品在当前竞争格局下的机会点。

【分析维度】

1. 深度用户画像：
用表格描述3类典型用户：他们的痛点是什么？他们在什么特定的美国生活场景下会急需此产品？
- 用户类型要具体（如："25-35岁都市白领"、"有3-5岁孩子的中产家庭"）
- 痛点要真实、具体（如："冬天通勤手冷，但戴手套不方便操作手机"）
- 使用场景要具体到美国生活细节（如："纽约地铁通勤"、"加州周末徒步"）

2. 竞品缺口洞察：
基于图片显示的工艺和功能，分析相比Top 3竞品，该产品的优势和致命短板各是什么？
- 优势要具体（如："采用双层保温结构，比竞品单层结构保温效果提升40%"）
- 致命短板要客观、可改进（如："缺少手机触控功能，在-10°C以下触控失灵"）
- 要基于图片能看到的实际工艺和功能，不要猜测

3. 产品机会清单：
- 痛点转化：将收集到的用户吐槽转化为具体的、具有差异化的产品需求点
  * 不要说"提升质量"，要说"将接口由塑料改为不锈钢，增加200%耐用度"
  * 不要说"改善体验"，要说"增加拇指触控区，支持-20°C低温触控"
- 优先级路线图：按"开发成本"与"市场溢价空间"两个维度，列出改进优先级
  * 开发成本：low（<10万）、medium（10-50万）、high（>50万）
  * 市场溢价：low（<5%）、medium（5-15%）、high（>15%）
  * 优先级：综合考虑成本和溢价，high优先级应该是"低成本+高溢价"或"高成本+极高溢价"

【输出要求】
- 逻辑必须严密，所有分析都要有依据
- 不要说空泛的话，要具体到可执行的改进点
- 输出必须为严格JSON格式，不要额外解释，不要Markdown代码块
- 用户画像至少3类，竞品分析至少3个优势+3个短板，机会清单至少5个改进点

【输出JSON结构】
{
  "user_profiles": [
    {
      "type": "具体的用户类型描述（如：25-35岁都市白领）",
      "pain_points": ["具体的痛点1", "具体的痛点2", "具体的痛点3"],
      "usage_scenarios": ["具体的使用场景1（美国生活细节）", "具体的使用场景2"]
    }
  ],
  "competitor_analysis": {
    "advantages": ["具体优势1（有数据支撑）", "具体优势2", "具体优势3"],
    "fatal_flaws": ["具体短板1（可改进）", "具体短板2", "具体短板3"]
  },
  "opportunity_roadmap": [
    {
      "pain_point": "用户痛点描述",
      "product_requirement": "具体的产品需求点（如：将接口由塑料改为不锈钢）",
      "development_cost": "low|medium|high",
      "market_premium": "low|medium|high",
      "priority": "high|medium|low",
      "reason": "优先级判断理由"
    }
  ]
}`;

    default:
      throw new Error(`Unknown promptType: ${promptType}`);
  }
}
