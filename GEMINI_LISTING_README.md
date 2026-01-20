# Gemini Listing 生成功能 - 部署说明

## 功能概述

已成功实现点击"生成 Listing"按钮时，调用 Google Gemini API 分析产品标题和图片，生成符合亚马逊规范的 Listing 文案（JSON 格式）。

## 已完成的工作

### 1. 创建 Gemini API 端点

**文件**: `api/generate-listing.js`

- ✅ 实现 Gemini API 调用逻辑
- ✅ 接收产品标题和图片 URL
- ✅ 使用专业提示词生成 Listing
- ✅ 返回 JSON 格式结果
- ✅ 完整的错误处理

**环境变量**: `GEMINI_API_KEY`（已在 Vercel 配置）

### 2. 前端功能实现

**文件**: `index.html` 和 `pages/products.html`

- ✅ 修改 `handleAction` 函数，添加 generateListing 处理逻辑
- ✅ 实现 `generateListingWithAI` 函数（API 调用）
- ✅ 实现 `renderListingResult` 函数（结果展示）
- ✅ 实现 `copyListingToClipboard` 函数（复制功能）
- ✅ 添加加载动画和样式

### 3. 生成的 JSON 结构

```json
{
  "product_name_en": "产品英文名称",
  "product_name_cn": "产品中文名称",
  "title_en": "英文标题（≤180字符）",
  "title_cn": "中文标题",
  "bullets_en": [
    "五点描述1（Feature → Benefit → Use case）",
    "五点描述2",
    "五点描述3",
    "五点描述4",
    "五点描述5"
  ],
  "assumptions": [
    {
      "item": "假设项目",
      "reason": "依据（来自标题或图片）"
    }
  ]
}
```

## 部署步骤

### 1. 确认环境变量

登录 Vercel 控制台，确认已配置：

- **变量名**: `GEMINI_API_KEY`
- **值**: `AIza...`（你的 Gemini API Key）
- **环境**: Production, Preview, Development

### 2. 部署到 Vercel

#### 方法 A: 自动部署（推荐）

如果已连接 Git 仓库：

1. 提交代码到 Git：
```bash
git add .
git commit -m "feat: 添加 Gemini Listing 生成功能"
git push
```

2. Vercel 会自动检测并部署

#### 方法 B: 手动部署

```bash
# 如果已安装 Vercel CLI
vercel --prod
```

### 3. 测试功能

部署完成后：

1. 访问你的网站（例如：`https://your-site.vercel.app`）
2. 点击任意产品卡片上的"生成 Listing"按钮
3. 应该看到：
   - ✅ 加载动画
   - ✅ AI 生成的产品名称、标题、五点描述
   - ✅ 假设说明（如果有不确定的信息）
   - ✅ 复制 JSON 按钮

## 使用说明

### 用户操作流程

1. 浏览产品列表
2. 点击产品卡片上的"生成 Listing"按钮
3. 等待 AI 分析（通常 3-10 秒）
4. 查看生成的 Listing 文案
5. 点击"复制 JSON"按钮复制结果

### 数据来源

- **标题**: 来自 CSV 的"商品标题"字段
- **图片**: 来自 CSV 的"商品主图"字段（在线 URL）
- **ASIN**: 用于日志记录

## 提示词说明

使用的专业提示词确保：

1. ✅ **只使用真实信息**：仅从标题和图片提取可确定的信息
2. ✅ **合规要求**：不使用 emoji、夸张词、虚构信息
3. ✅ **字符限制**：标题和每条五点描述 ≤ 180 字符
4. ✅ **专业结构**：Feature → Benefit → Use case
5. ✅ **假设说明**：不确定的信息会在 assumptions 中列出

## 错误处理

已实现完整的错误处理：

- **API Key 缺失** → 返回 500 错误
- **图片加载失败** → 显示具体错误信息
- **Gemini API 调用失败** → 显示友好错误提示
- **JSON 解析失败** → 降级显示原始内容

## 文件清单

### 新增文件

- `api/generate-listing.js` - Gemini API 端点（serverless function）

### 修改文件

- `index.html` - 添加前端逻辑和样式
- `pages/products.html` - 同步添加前端逻辑和样式

## 技术细节

### API 调用流程

```
用户点击按钮
    ↓
前端提取 title + imageUrl
    ↓
POST /api/generate-listing
    ↓
Serverless Function 获取图片并转 base64
    ↓
调用 Gemini API (gemini-1.5-flash)
    ↓
返回 JSON 结构的 Listing
    ↓
前端解析并展示
```

### 使用的 Gemini 模型

- **模型**: `gemini-1.5-flash`
- **能力**: 支持文本 + 图片多模态输入
- **配置**: 
  - `temperature: 0.4`（较低温度确保稳定输出）
  - `responseMimeType: "application/json"`（强制 JSON 输出）

## 后续优化建议

1. **缓存机制**: 对相同 ASIN 的结果进行缓存
2. **批量生成**: 支持一次生成多个产品的 Listing
3. **编辑功能**: 允许用户编辑生成的内容
4. **历史记录**: 保存已生成的 Listing
5. **导出功能**: 支持导出为 Excel/CSV

## 常见问题

### Q: 为什么生成需要 3-10 秒？

A: 需要下载图片、调用 Gemini API 并分析，这是正常的处理时间。

### Q: 如果图片 URL 失效怎么办？

A: 系统会捕获错误并显示友好提示，建议使用稳定的图片链接。

### Q: 生成的内容不符合预期怎么办？

A: 可以调整 `api/generate-listing.js` 中的提示词或 `temperature` 参数。

### Q: 支持哪些图片格式？

A: 支持 JPEG、PNG、WebP 等常见格式，Gemini API 会自动识别。

## 联系与支持

如有问题，请检查：

1. Vercel 部署日志
2. 浏览器控制台错误信息
3. Gemini API 配额使用情况

---

**部署时间**: 2026-01-20  
**版本**: v1.0.0  
**状态**: ✅ 已完成，待部署测试
