# API 选择与配置指南

你当前遇到的错误：**API key not valid**

本指南帮你选择并正确配置 API。

---

## 🎯 你想使用哪个 API？

### 选项1：Vercel AI Gateway（推荐）✅

**优势**：
- 统一的 API 网关
- 内置速率控制和监控
- 更好的可观察性

**配置步骤**：
1. 使用当前的 `api/generate-listing.js`（已修改）
2. 按照 `VERCEL_AI_GATEWAY_SETUP.md` 配置
3. 需要设置的环境变量：`AI_GATEWAY_API_KEY`

**关键修改点**：
- **第94行**：替换为你的实际 Gateway URL
  ```javascript
  const url = 'https://gateway.ai.cloudflare.com/v1/<YOUR_ACCOUNT_ID>/<YOUR_GATEWAY_ID>/google/gemini-3-flash';
  ```

---

### 选项2：Google 官方 Gemini API

**优势**：
- 直接调用，无中间层
- 设置简单

**配置步骤**：
1. **重命名文件**：
   ```bash
   # 备份当前文件
   mv api/generate-listing.js api/generate-listing.vercel.js
   
   # 使用 Google 版本
   mv api/generate-listing.google.js api/generate-listing.js
   ```

2. **获取 API Key**：
   - 访问：https://aistudio.google.com/app/apikey
   - 创建新的 API Key
   - 复制 key（格式：`AIza...`）

3. **设置 Vercel 环境变量**：
   - 变量名：`GOOGLE_GEMINI_API_KEY`
   - 变量值：你的 API Key
   - 环境：全选（Production, Preview, Development）

4. **重新部署**

---

## 🔍 如何判断当前使用的是哪个版本？

检查 `api/generate-listing.js` 的第7行：

```javascript
// Vercel AI Gateway 版本
* - AI_GATEWAY_API_KEY: Vercel AI Gateway 的 API Key

// Google 官方版本
* - GOOGLE_GEMINI_API_KEY: Google Gemini 的 API Key
```

---

## 📋 环境变量对照表

| 方案 | 环境变量名 | Key 格式示例 | 获取位置 |
|------|-----------|-------------|----------|
| **Vercel AI Gateway** | `AI_GATEWAY_API_KEY` | `vag_abc123...` | Vercel AI Gateway 控制台 |
| **Google 官方** | `GOOGLE_GEMINI_API_KEY` | `AIzaSyD...` | https://aistudio.google.com/app/apikey |

---

## 🚨 快速修复：如果你已经有了 Google API Key

如果你手头有 Google 的 Gemini API Key，最快的修复方法：

### 步骤1：重命名文件（Windows PowerShell）

```powershell
cd C:\Users\Admin\Documents\GitHub\simple-wall

# 备份当前的 Vercel Gateway 版本
Rename-Item -Path "api\generate-listing.js" -NewName "generate-listing.vercel.js"

# 使用 Google 官方版本
Rename-Item -Path "api\generate-listing.google.js" -NewName "generate-listing.js"
```

### 步骤2：设置环境变量

1. 打开 Vercel 项目：https://vercel.com/dashboard
2. Settings → Environment Variables
3. 添加：
   - Name: `GOOGLE_GEMINI_API_KEY`
   - Value: 你的 Google API Key
4. 重新部署

### 步骤3：测试

点击"生成Listing"，检查 Vercel 日志：

```
[generate-listing] 🔑 API Key loaded: AIza...xyz (length: 39)
[generate-listing] 📤 Processing ASIN: B0XXXXXX
[generate-listing] 🌐 Request URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=****
[generate-listing] 📥 Response status: 200
[generate-listing] ✅ Success for ASIN: B0XXXXXX
```

---

## 🐛 常见错误诊断

### 错误：`CONFIG_ERROR` - 环境变量未找到

**症状**：
```
[generate-listing] ❌ AI_GATEWAY_API_KEY not found in environment variables
```

**原因**：环境变量未设置或名称错误

**解决**：
1. 检查 Vercel 控制台的环境变量名称是否完全匹配
2. 确认已选择所有环境（Production, Preview, Development）
3. **必须重新部署**才能生效

---

### 错误：`API key not valid`

**症状**：
```
{
  "error": {
    "code": 400,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "INVALID_ARGUMENT"
  }
}
```

**原因**：
- API Key 值不正确
- API Key 有多余的空格或换行符
- 使用了错误的 API（如：把 Vercel Gateway key 用在了 Google API 上）

**解决**：
1. 重新复制 API Key，确保没有多余字符
2. 确认使用的是正确的 key 类型：
   - Google 官方：以 `AIza` 开头
   - Vercel Gateway：以 `vag_` 开头（示例，具体格式看你的 Gateway）
3. 在 Vercel 控制台重新粘贴，保存后重新部署

---

### 错误：`404 Not Found`（仅 Vercel AI Gateway）

**原因**：Gateway URL 不正确

**解决**：检查 `api/generate-listing.js` 第94行的 URL：
- 确认 `YOUR_ACCOUNT_ID` 已替换
- 确认 `YOUR_GATEWAY_ID` 已替换
- 确认模型名称为 `google/gemini-3-flash`（带 `google/` 前缀）

---

## 💡 推荐配置（根据你的情况选择）

### 情况A：你已经有 Google Gemini API Key
→ **使用选项2**（Google 官方 API），最快5分钟完成

### 情况B：你想使用 Vercel AI Gateway 的高级功能
→ **使用选项1**（Vercel AI Gateway），需要配置 Gateway URL

### 情况C：你不确定有什么 Key
→ 先使用**选项2**（Google 官方），去 https://aistudio.google.com/app/apikey 免费获取

---

## 📞 需要帮助？

请提供以下信息：
1. 你选择的方案（选项1 或 选项2）
2. Vercel Functions 日志（包含 `[generate-listing]` 的完整日志）
3. 环境变量截图（脱敏 API Key 的中间部分）

---

**更新日期**: 2026-01-21
