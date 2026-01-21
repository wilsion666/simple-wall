# Vercel AI Gateway 配置说明

## 概述

本项目已修改为使用 **Vercel AI Gateway**（OpenAI-compatible API）来调用 Gemini 模型，而不是直接调用 Google 官方 Gemini API。

## 修改内容

### 1. 后端 API (`/api/generate-listing.js`)

**主要修改：**
- ✅ 从 `process.env.AI_GATEWAY_API_KEY` 读取 API Key（以 `vck_` 开头）
- ✅ 使用 `https://ai-gateway.vercel.sh/v1/chat/completions` 作为 API 端点
- ✅ 使用 `Authorization: Bearer <token>` header 进行认证
- ✅ 使用 `Content-Type: application/json` header
- ✅ model 设置为 `google/gemini-3-flash`
- ✅ 使用 OpenAI Chat Completions 格式（而非 Google Gemini 格式）
- ✅ 支持图片 URL（可选）
- ✅ 增加详细的控制台日志，方便调试

### 2. 前端 (`/pages/products.html`)

**主要修改：**
- ✅ 保持调用 `/api/generate-listing` 端点（无需修改）
- ✅ 增加详细的 console.log，方便定位问题
- ✅ 改进错误显示，提示用户查看控制台
- ✅ 确保没有在浏览器端使用 `process.env` 或写死的 API key

## Vercel 环境变量配置

### 步骤 1：获取 Vercel AI Gateway API Key

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入 **Settings** → **AI**
3. 创建或查看你的 AI Gateway API Key（以 `vck_` 开头）

### 步骤 2：在 Vercel 中设置环境变量

1. 进入你的项目页面
2. 点击 **Settings** → **Environment Variables**
3. 添加以下环境变量：

   ```
   名称: AI_GATEWAY_API_KEY
   值: vck_xxxxxxxxxxxxxxxxxxxxxxxxxx
   环境: Production, Preview, Development（全选）
   ```

4. 点击 **Save**

### 步骤 3：重新部署

环境变量修改后，需要重新部署才能生效：

1. 方式 1：在 Vercel Dashboard 点击 **Redeploy**
2. 方式 2：推送新的 commit 触发自动部署

## 测试流程

### 1. 本地测试（可选）

如果你想在本地测试，创建 `.env.local` 文件：

```bash
# .env.local
AI_GATEWAY_API_KEY=vck_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

然后运行：

```bash
npm install -g vercel
vercel dev
```

### 2. 生产环境测试

1. 访问你的网站：`https://your-site.vercel.app/pages/products.html`
2. 点击任意产品的 **"生成listing"** 按钮
3. 打开浏览器控制台（F12），查看日志：

**成功的日志示例：**
```
[generateListingWithAI] 开始调用 API
[generateListingWithAI] 产品信息: {asin: "B0...", title: "...", imageUrl: "..."}
[generateListingWithAI] 发送请求到 /api/generate-listing
[generateListingWithAI] 收到响应，状态码: 200
[generateListingWithAI] ✅ 成功生成 Listing
```

**失败的日志示例（配置错误）：**
```
[generate-listing] ❌ AI_GATEWAY_API_KEY not found in environment variables
[generate-listing] 💡 Please set AI_GATEWAY_API_KEY (vck_ prefix) in Vercel environment variables
```

## 常见问题排查

### 问题 1：API Key 未找到

**错误信息：**
```json
{
  "error": "Server configuration error: AI_GATEWAY_API_KEY not found",
  "code": "CONFIG_ERROR"
}
```

**解决方案：**
1. 确认在 Vercel Dashboard 中设置了 `AI_GATEWAY_API_KEY` 环境变量
2. 确认环境变量名称拼写正确（区分大小写）
3. 确认环境变量应用到了所有环境（Production, Preview, Development）
4. 重新部署项目

### 问题 2：认证失败

**错误信息：**
```json
{
  "error": "Unauthorized",
  "code": "API_ERROR",
  "status": 401
}
```

**解决方案：**
1. 确认 API Key 以 `vck_` 开头
2. 确认 API Key 没有多余的空格或换行符
3. 在 Vercel Dashboard 中重新生成 API Key
4. 更新环境变量后重新部署

### 问题 3：模型不可用

**错误信息：**
```json
{
  "error": "Model not found",
  "code": "API_ERROR"
}
```

**解决方案：**
1. 确认你的 Vercel AI Gateway 配置中启用了 Gemini 模型
2. 检查模型名称是否正确：`google/gemini-3-flash`
3. 如果需要使用其他模型，可以修改 `/api/generate-listing.js` 中的 `model` 字段

### 问题 4：图片加载失败

**错误信息：**
```
Failed to fetch and encode image
```

**解决方案：**
1. 确认图片 URL 可以公开访问（不需要认证）
2. 确认图片 URL 使用 HTTPS 协议
3. 如果图片有 CORS 限制，可能需要在服务器端配置 CORS

## API 请求格式说明

### 前端调用格式

```javascript
fetch('/api/generate-listing', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    asin: 'B0DLNJGLXS',           // 产品 ASIN
    title: 'Product Title...',     // 产品标题（必需）
    imageUrl: 'https://...'        // 产品图片 URL（可选）
  })
})
```

### 后端调用 Vercel AI Gateway 格式

```javascript
fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer vck_xxxxxxxxxxxxxxxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-3-flash',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: '提示词...' },
          { type: 'image_url', image_url: { url: 'https://...' } }
        ]
      }
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' }
  })
})
```

## 文件清单

修改的文件：
1. ✅ `/api/generate-listing.js` - 后端 API，改用 Vercel AI Gateway
2. ✅ `/pages/products.html` - 前端页面，增加日志和错误处理

未修改的文件：
- `/api/generate-listing.google.js` - 保留作为备份（使用 Google 官方 API）

## 成本说明

Vercel AI Gateway 的计费方式：
- 根据实际使用的模型和 token 数量计费
- 不同模型价格不同，Gemini 3 Flash 是较便宜的选项
- 可以在 Vercel Dashboard 查看使用情况和费用

## 安全建议

1. ✅ **不要在前端代码中暴露 API Key**
2. ✅ **不要将 `.env.local` 文件提交到 Git**
3. ✅ **定期轮换 API Key**
4. ✅ **在 Vercel Dashboard 中监控 API 使用情况**
5. ✅ **设置合理的速率限制，防止滥用**

## 联系支持

如果遇到问题：
1. 查看浏览器控制台（F12）的详细日志
2. 查看 Vercel Dashboard 中的 Function Logs
3. 参考 [Vercel AI Gateway 文档](https://vercel.com/docs/ai-gateway)

---

**最后更新：** 2026-01-21
**状态：** ✅ 已完成并测试
