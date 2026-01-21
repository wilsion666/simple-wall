# 🔧 API Key 错误修复总结

## 📊 诊断结果

### 当前系统配置（修改前）

✅ **证据已找到**：

1. **实际调用的 API**：Google 官方 Gemini API（不是 Vercel AI Gateway）
   - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
   - 位置：`api/generate-listing.js` 第87、116行

2. **环境变量**：
   - 当前使用：`gemini3propreview`（第15行）
   - ❌ 这个变量可能未设置或值不正确

3. **API Key 传递方式**：
   - 当前：URL 参数 `?key=xxx`（Google 官方标准方式）

4. **错误原因**：
   - 环境变量 `gemini3propreview` 在 Vercel 中未配置或值错误
   - 导致 API 返回 "API key not valid"

---

## 🎯 修复方案（已实施）

我已经准备了**两套解决方案**，你可以选择其中一个：

### 方案1：迁移到 Vercel AI Gateway（当前版本）✅

**已修改的文件**：`api/generate-listing.js`

**主要改动**：
1. 环境变量：`gemini3propreview` → `AI_GATEWAY_API_KEY`
2. 认证方式：URL 参数 → `Authorization: Bearer` header
3. 模型名称：`gemini-1.5-flash` → `google/gemini-3-flash`
4. 添加了详细的调试日志（打印 URL、Key 前4后4）

**需要你手动完成**：
1. 修改 `api/generate-listing.js` 第94行的 Gateway URL
   ```javascript
   // 替换为你的实际值
   const url = 'https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/google/gemini-3-flash';
   ```

2. 在 Vercel 控制台添加环境变量：
   - Name: `AI_GATEWAY_API_KEY`
   - Value: 你的 Vercel AI Gateway API Key

3. 重新部署

**详细指南**：`VERCEL_AI_GATEWAY_SETUP.md`

---

### 方案2：继续使用 Google 官方 API（备选）

**已创建的文件**：`api/generate-listing.google.js`

**特点**：
- 保持使用 Google 官方 API
- 改进了环境变量命名：`GOOGLE_GEMINI_API_KEY`（更标准）
- 添加了详细的调试日志

**切换步骤**：
```powershell
# 在项目根目录执行
Rename-Item -Path "api\generate-listing.js" -NewName "generate-listing.vercel.js"
Rename-Item -Path "api\generate-listing.google.js" -NewName "generate-listing.js"
```

**需要你完成**：
1. 获取 Google API Key：https://aistudio.google.com/app/apikey
2. 在 Vercel 控制台添加环境变量：
   - Name: `GOOGLE_GEMINI_API_KEY`
   - Value: 你的 Google API Key（格式：`AIzaSy...`）
3. 重新部署

---

## 📋 需要修改的文件列表

### 已修改/创建的文件：

| 文件路径 | 状态 | 说明 |
|---------|------|------|
| `api/generate-listing.js` | ✅ 已修改 | 改为使用 Vercel AI Gateway |
| `api/generate-listing.google.js` | ✅ 新建 | 备选：Google 官方 API 版本 |
| `VERCEL_AI_GATEWAY_SETUP.md` | ✅ 新建 | Vercel AI Gateway 配置指南 |
| `API_SELECTION_GUIDE.md` | ✅ 新建 | API 选择与配置指南 |
| `FIX_SUMMARY.md` | ✅ 新建 | 本文件 - 修复总结 |

### 前端文件（无需修改）：

| 文件路径 | 状态 | 说明 |
|---------|------|------|
| `index.html` | ⚪ 无需修改 | 前端已正确调用 `/api/generate-listing` |

---

## 🔍 新增的调试日志

修改后的代码会输出以下日志（在 Vercel Functions 面板查看）：

### 成功的日志示例：

```
[generate-listing] 🔑 API Key loaded: sk12...ab34 (length: 64)
[generate-listing] 📤 Processing ASIN: B0XXXXXX
[generate-listing] 🌐 Request URL: https://gateway.ai.cloudflare.com/v1/.../google/gemini-3-flash
[generate-listing] 🔑 Authorization: Bearer sk12...ab34
[generate-listing] 📥 Response status: 200
[generate-listing] ✅ Success for ASIN: B0XXXXXX
```

### 环境变量未设置的日志：

```
[generate-listing] ❌ AI_GATEWAY_API_KEY not found in environment variables
[generate-listing] Available env keys: ['VERCEL_URL', 'NODE_ENV', ...]
```

### API Key 错误的日志：

```
[generate-listing] 📥 Response status: 400
[generate-listing] ❌ API error: 400
[generate-listing] Error details: { "error": { "message": "API key not valid" } }
[generate-listing] 🔐 This appears to be an API key authentication error!
[generate-listing] 💡 Please check:
[generate-listing]    1. AI_GATEWAY_API_KEY is set in Vercel environment variables
[generate-listing]    2. The key value is correct (check for extra spaces)
[generate-listing]    3. The gateway URL includes your correct account ID and gateway ID
```

---

## ⚙️ Vercel 环境变量设置（根据方案选择）

### 方案1：Vercel AI Gateway

| 变量名 | 值格式 | 示例 | 获取位置 |
|--------|-------|------|----------|
| `AI_GATEWAY_API_KEY` | Gateway Key | `vag_xxx...` | Vercel AI Gateway 控制台 |

### 方案2：Google 官方 API

| 变量名 | 值格式 | 示例 | 获取位置 |
|--------|-------|------|----------|
| `GOOGLE_GEMINI_API_KEY` | Google Key | `AIzaSyD...` | https://aistudio.google.com/app/apikey |

**设置步骤**：
1. Vercel 项目 → Settings → Environment Variables
2. 点击 "Add New"
3. 填写变量名和值
4. Environments 选择：`Production`, `Preview`, `Development`（全选）
5. 点击 Save
6. **重新部署项目**（关键！环境变量修改后必须重新部署）

---

## 📝 代码差异对比

### 关键修改点：

#### 1. 环境变量（第15行）

```diff
- const apiKey = process.env.gemini3propreview;
+ const apiKey = process.env.AI_GATEWAY_API_KEY;  // 方案1
+ const apiKey = process.env.GOOGLE_GEMINI_API_KEY;  // 方案2
```

#### 2. API URL（第94行，仅方案1）

```diff
- const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
+ const url = 'https://gateway.ai.cloudflare.com/v1/<YOUR_ACCOUNT_ID>/<YOUR_GATEWAY_ID>/google/gemini-3-flash';
```

#### 3. 认证方式（第116行，仅方案1）

```diff
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
+     'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

- // 方案2：Google 官方使用 URL 参数
- const response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
```

#### 4. 添加调试日志

```javascript
// 环境变量检查（第17-29行）
console.log(`[generate-listing] 🔑 API Key loaded: ${keyPreview} (length: ${apiKey.length})`);

// 请求日志（第127-129行）
console.log(`[generate-listing] 📤 Processing ASIN: ${asin || 'N/A'}`);
console.log(`[generate-listing] 🌐 Request URL: ${url}`);
console.log(`[generate-listing] 🔑 Authorization: Bearer ${keyPreview}`);

// 响应日志（第137行）
console.log(`[generate-listing] 📥 Response status: ${response.status}`);

// 错误诊断（第143-150行）
if (errorMsg.toLowerCase().includes('api key')) {
  console.error('[generate-listing] 🔐 This appears to be an API key authentication error!');
  console.error('[generate-listing] 💡 Please check: ...');
}
```

---

## ✅ 下一步行动清单

根据你选择的方案：

### 方案1：Vercel AI Gateway

- [ ] 获取 Vercel AI Gateway 的完整 Endpoint URL
- [ ] 修改 `api/generate-listing.js` 第94行（替换 YOUR_ACCOUNT_ID 和 YOUR_GATEWAY_ID）
- [ ] 在 Vercel 控制台添加 `AI_GATEWAY_API_KEY` 环境变量
- [ ] 重新部署项目
- [ ] 测试"生成Listing"功能
- [ ] 查看 Vercel Functions 日志验证修复

### 方案2：Google 官方 API

- [ ] 访问 https://aistudio.google.com/app/apikey 获取 API Key
- [ ] 重命名文件：`generate-listing.google.js` → `generate-listing.js`
- [ ] 在 Vercel 控制台添加 `GOOGLE_GEMINI_API_KEY` 环境变量
- [ ] 重新部署项目
- [ ] 测试"生成Listing"功能
- [ ] 查看 Vercel Functions 日志验证修复

---

## 🆘 如果仍然报错

请提供以下信息：

1. **你选择的方案**：方案1 还是 方案2？

2. **Vercel Functions 日志**（完整）：
   - 访问：Vercel Dashboard → 你的项目 → Deployments → 最新部署 → Functions
   - 复制所有包含 `[generate-listing]` 的日志

3. **浏览器控制台错误**：
   - 按 F12 打开开发者工具
   - 点击"生成Listing"
   - 复制 Console 和 Network 中的错误信息

4. **环境变量截图**（脱敏）：
   - Vercel → Settings → Environment Variables
   - 只显示变量名和值的前4后4字符

---

**修复完成时间**: 2026-01-21  
**适用版本**: Vercel Serverless Functions  
**测试状态**: ⏳ 等待你选择方案并测试
