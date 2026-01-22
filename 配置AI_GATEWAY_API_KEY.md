# 🔧 配置 AI_GATEWAY_API_KEY - 快速指南

## 问题
当前错误：`Server configuration error: AI_GATEWAY_API_KEY not found`

## ✅ 解决步骤（5分钟）

### 步骤 1：获取 Vercel AI Gateway API Key

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击右上角头像 → **Settings**
3. 在左侧菜单找到 **AI** 或 **AI Gateway**
4. 如果还没有创建 Gateway：
   - 点击 **Create Gateway** 或 **New Gateway**
   - 选择模型：`google/gemini-3-flash` 或 `google/gemini-1.5-flash`
   - 创建后会自动生成 API Key
5. 复制 API Key（格式：`vck_` 开头，例如：`vck_abc123...xyz789`）

> 💡 **提示**：如果找不到 AI Gateway 设置，可能需要：
> - 确保你的 Vercel 账户有 AI Gateway 访问权限
> - 或者使用 Vercel Pro 计划

### 步骤 2：在 Vercel 项目中设置环境变量

1. 在 Vercel Dashboard 中，进入你的项目 `simple-wall`
2. 点击 **Settings**（项目设置）
3. 在左侧菜单点击 **Environment Variables**
4. 点击 **Add New** 按钮
5. 填写以下信息：
   ```
   Name: AI_GATEWAY_API_KEY
   Value: vck_你的实际API密钥（粘贴刚才复制的）
   Environments: ✅ Production ✅ Preview ✅ Development（全选）
   ```
6. 点击 **Save**

### 步骤 3：重新部署（重要！）

环境变量修改后，**必须重新部署**才能生效：

**方式 1：在 Dashboard 重新部署（推荐）**
1. 在项目页面，点击 **Deployments** 标签
2. 找到最新的部署记录
3. 点击右侧的 **⋯** 菜单
4. 选择 **Redeploy**
5. 等待部署完成（通常 1-2 分钟）

**方式 2：通过 Git 推送触发**
```bash
git commit --allow-empty -m "触发重新部署以应用环境变量"
git push
```

### 步骤 4：验证配置

1. 部署完成后，访问你的网站
2. 尝试生成一个 Listing
3. 如果成功，说明配置正确 ✅
4. 如果仍然报错，查看 Vercel Functions 日志：
   - 项目 → **Functions** 标签
   - 找到 `generate-listing` 函数
   - 查看日志，应该看到：
     ```
     [generate-listing] 🔑 API Key loaded: vck_...xxxx (length: XX)
     ```

## ❌ 常见问题

### 问题 1：找不到 AI Gateway 设置

**可能原因**：
- Vercel 账户没有 AI Gateway 访问权限
- 需要使用 Vercel Pro 计划

**解决方案**：
- 检查你的 Vercel 计划
- 或者考虑使用 Google 官方 API（需要切换到 `generate-listing.google.js`）

### 问题 2：设置了环境变量但还是报错

**检查清单**：
- [ ] 变量名是否完全一致：`AI_GATEWAY_API_KEY`（区分大小写）
- [ ] 是否选择了所有环境（Production, Preview, Development）
- [ ] 是否已经重新部署
- [ ] API Key 值是否正确（没有多余空格）

### 问题 3：API Key 格式不对

**正确格式**：
- 应该以 `vck_` 开头
- 长度通常在 40-60 字符之间
- 不应该包含空格或换行

**如果格式不对**：
- 回到 Vercel AI Gateway 设置页面
- 重新生成一个新的 API Key
- 更新环境变量

## 📋 快速检查清单

完成以下所有步骤后，问题应该解决：

- [ ] 已在 Vercel Dashboard → Settings → AI 中获取 API Key
- [ ] 已在项目 Settings → Environment Variables 中添加 `AI_GATEWAY_API_KEY`
- [ ] 已选择所有环境（Production, Preview, Development）
- [ ] 已重新部署项目
- [ ] 已测试生成 Listing 功能
- [ ] 已检查 Functions 日志确认 API Key 已加载

## 🆘 仍然有问题？

如果完成以上步骤后仍然报错，请提供：
1. Vercel Functions 日志（完整的错误信息）
2. 浏览器控制台错误（F12）
3. 确认 API Key 的前4个字符（例如：`vck_`）

---

**最后更新**：2026-01-21
