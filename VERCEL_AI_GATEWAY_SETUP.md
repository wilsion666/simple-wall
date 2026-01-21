# Vercel AI Gateway 配置指南

## 🎯 目的
将 Gemini Listing 生成功能从 Google 官方 API 迁移到 Vercel AI Gateway。

---

## 📋 配置步骤

### 1. 获取 Vercel AI Gateway URL

1. 登录你的 **Vercel AI Gateway 控制台**
2. 找到你的 Gateway 配置页面
3. 复制完整的 **Endpoint URL**，格式类似：
   ```
   https://gateway.ai.cloudflare.com/v1/<YOUR_ACCOUNT_ID>/<YOUR_GATEWAY_ID>/google/gemini-3-flash
   ```

### 2. 修改代码中的 URL

打开 `api/generate-listing.js`，找到第 94 行左右：

```javascript
// 当前代码（需要修改）：
const url = 'https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/google/gemini-3-flash';

// 修改为你的实际 URL：
const url = 'https://gateway.ai.cloudflare.com/v1/abc123/my-gateway/google/gemini-3-flash';
```

**重要提示：**
- 将 `YOUR_ACCOUNT_ID` 替换为你的实际账户ID
- 将 `YOUR_GATEWAY_ID` 替换为你的实际 Gateway ID
- 确保模型名称为 `google/gemini-3-flash`（注意前缀 `google/`）

### 3. 设置 Vercel 环境变量

#### 方法A：通过 Vercel 控制台（推荐）

1. 打开你的项目：https://vercel.com/dashboard
2. 选择你的项目 `simple-wall`
3. 进入 **Settings** → **Environment Variables**
4. 添加新变量：
   - **Name**: `AI_GATEWAY_API_KEY`
   - **Value**: 你的 Vercel AI Gateway API Key
   - **Environments**: 选择 `Production`, `Preview`, `Development`（全选）
5. 点击 **Save**
6. **重新部署**你的项目（必须！）

#### 方法B：通过本地开发（.env.local）

如果你在本地测试，创建 `.env.local` 文件：

```bash
# .env.local
AI_GATEWAY_API_KEY=your-actual-api-key-here
```

⚠️ **注意**：`.env.local` 文件不会被提交到 Git（已在 `.gitignore` 中）。

---

## 🔍 如何验证配置

### 1. 检查环境变量是否生效

部署后，查看 Vercel 的 **Functions** 日志，应该看到：

```
[generate-listing] 🔑 API Key loaded: sk12...ab34 (length: 64)
```

如果看到：
```
[generate-listing] ❌ AI_GATEWAY_API_KEY not found in environment variables
```
说明环境变量未设置或未生效，需要：
1. 检查 Vercel 控制台的环境变量拼写
2. 确认已重新部署

### 2. 检查 API 请求日志

成功的请求日志应该包含：

```
[generate-listing] 📤 Processing ASIN: B0XXXXXX
[generate-listing] 🌐 Request URL: https://gateway.ai.cloudflare.com/v1/.../google/gemini-3-flash
[generate-listing] 🔑 Authorization: Bearer sk12...ab34
[generate-listing] 📥 Response status: 200
[generate-listing] ✅ Success for ASIN: B0XXXXXX
```

### 3. 常见错误排查

#### 错误1：`API key not valid`
**原因**：
- API Key 未设置或不正确
- API Key 中有多余的空格
- Gateway URL 不正确

**解决方法**：
1. 检查 Vercel 环境变量中的 `AI_GATEWAY_API_KEY` 值
2. 确保没有前后空格
3. 验证 Gateway URL 的 account ID 和 gateway ID 是否正确

#### 错误2：`404 Not Found`
**原因**：Gateway URL 不正确

**解决方法**：
1. 检查 `api/generate-listing.js` 中的 URL
2. 确认模型名称为 `google/gemini-3-flash`（不是 `gemini-1.5-flash`）

#### 错误3：`401 Unauthorized`
**原因**：API Key 无效或过期

**解决方法**：
1. 在 Vercel AI Gateway 控制台重新生成 API Key
2. 更新 Vercel 环境变量
3. 重新部署

---

## 📝 对比：Google 官方 vs Vercel AI Gateway

| 项目 | Google 官方 API | Vercel AI Gateway |
|------|----------------|-------------------|
| **URL** | `generativelanguage.googleapis.com` | `gateway.ai.cloudflare.com` |
| **模型名** | `gemini-1.5-flash` | `google/gemini-3-flash` |
| **认证方式** | URL 参数 `?key=xxx` | Header `Authorization: Bearer xxx` |
| **环境变量** | `gemini3propreview` | `AI_GATEWAY_API_KEY` |
| **优势** | 直接调用 | 统一网关、速率控制、监控 |

---

## 🚀 快速检查清单

- [ ] 已获取 Vercel AI Gateway 的完整 Endpoint URL
- [ ] 已修改 `api/generate-listing.js` 中的 URL（第94行）
- [ ] 已在 Vercel 控制台添加 `AI_GATEWAY_API_KEY` 环境变量
- [ ] 已重新部署项目
- [ ] 测试"生成Listing"功能，检查日志输出
- [ ] 如有错误，查看上面的"常见错误排查"

---

## 💡 需要帮助？

如果仍然报错，请提供以下信息：
1. Vercel Functions 日志（完整的 `[generate-listing]` 相关日志）
2. 浏览器控制台的错误信息
3. 你的 Gateway URL 格式（脱敏后）

---

**修改时间**: 2026-01-21
**适用版本**: Vercel Serverless Functions
