# 环境变量配置说明

## Gemini API Key 配置

### 本地开发

1. 在项目根目录创建 `.env.local` 文件（此文件不会被提交到 Git）
2. 添加以下内容：

```
gemini3propreview=your-gemini-api-key-here
```

3. 将 `your-gemini-api-key-here` 替换为你的实际 Gemini API Key

### Vercel 部署

1. 登录 Vercel 控制台
2. 进入项目设置（Settings）
3. 找到 "Environment Variables" 部分
4. 添加新变量：
   - **Name**: `gemini3propreview`
   - **Value**: 你的 Google Gemini API Key
5. 选择环境（Production、Preview、Development）
6. 保存后重新部署

**注意**：您的 Vercel 环境中已经配置了名为 `gemini3propreview` 的变量。

### 获取 API Key

访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 注册并获取 API Key。

---

## DeepSeek API Key 配置

### 本地开发

1. 在项目根目录创建 `.env.local` 文件（此文件不会被提交到 Git）
2. 添加以下内容：

```
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
```

3. 将 `sk-your-deepseek-api-key-here` 替换为你的实际 DeepSeek API Key

### Vercel 部署

1. 登录 Vercel 控制台
2. 进入项目设置（Settings）
3. 找到 "Environment Variables" 部分
4. 添加新变量：
   - **Name**: `DEEPSEEK_API_KEY`
   - **Value**: 你的 DeepSeek API Key（以 `sk-` 开头）
5. 选择环境（Production、Preview、Development）
6. 保存后重新部署

### 获取 API Key

访问 [DeepSeek Platform](https://platform.deepseek.com/) 注册并获取 API Key。

### 安全提示

⚠️ **重要**：
- API Key 只能放在服务端环境变量中
- 不要将 API Key 提交到 Git 仓库
- 不要在前端代码、日志、提交记录中暴露 API Key
- `.env.local` 文件应添加到 `.gitignore`
