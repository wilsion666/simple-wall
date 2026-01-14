# 聊天记录本地保存功能测试步骤

## 修改文件清单

本次功能实现修改了以下 1 个文件：

1. **chat.html** - 添加了 localStorage 保存/恢复功能、清空记录和导出记录按钮

## 功能说明

### 1. 自动保存
- 每当消息（user 或 assistant）添加到对话时，自动保存到 localStorage
- 存储 key 格式：`chat:${asin}:${tpl}`（如果 asin/tpl 缺失，则用 `chat:default`）
- 存储内容：完整的 messages 数组，包含 `role`、`content`、`ts`（时间戳）

### 2. 自动恢复
- 页面加载时，自动从 localStorage 读取历史记录
- 如果有历史记录，优先显示历史记录，不自动执行 URL 参数触发的 API 调用
- 如果没有历史记录，则按原有逻辑自动执行 API 调用

### 3. UI 按钮
- **清空记录**：清空当前会话的 localStorage 和页面消息
- **导出记录**：导出 JSON 文件（文件名格式：`chat-${asin}-${tpl}-${timestamp}.json`）

## 本地测试步骤

### 测试 1：验证自动保存

1. 访问 `/chat.html`（不带参数）或带参数访问（如 `/chat.html?tpl=plan&asin=B08XXX&cat=Sports`）
2. 发送一条消息："你好"
3. 等待 AI 回复完成
4. **验证步骤**：
   - 打开浏览器开发者工具（F12）→ Application 标签 → Local Storage
   - 查看是否有对应的 key（如 `chat:B08XXX:plan` 或 `chat:default`）
   - 点击 key，查看 value 是否为 JSON 格式，包含 role、content、ts 字段
5. **预期结果**：
   - localStorage 中有对应的 key
   - value 是有效的 JSON 数组
   - 数组中包含刚才发送和接收的消息

### 测试 2：验证自动恢复

1. 在测试 1 的基础上，刷新页面（F5）
2. **预期结果**：
   - 页面加载后，自动显示之前的对话记录
   - 消息顺序和内容与刷新前一致
   - 如果是从 URL 参数跳转来的，不会自动执行 API 调用（因为有历史记录）

### 测试 3：验证同一 ASIN 可续聊

1. 访问 `/chat.html?tpl=plan&asin=B08XXX&cat=Sports`
2. 发送消息："请生成产品方案"
3. 等待回复完成
4. 刷新页面
5. 在输入框输入："请详细说明第一个差异化方向"
6. 点击发送
7. **预期结果**：
   - 刷新后历史记录恢复
   - 新消息追加到历史记录后面
   - AI 能够理解上下文，给出相关回复
   - localStorage 中保存了完整的对话历史

### 测试 4：验证不同 ASIN 独立存储

1. 访问 `/chat.html?tpl=plan&asin=B08XXX&cat=Sports`
2. 发送几条消息
3. 访问 `/chat.html?tpl=plan&asin=B09YYY&cat=Sports`（不同的 ASIN）
4. **预期结果**：
   - 显示的是新会话，没有之前的消息
   - localStorage 中有两个不同的 key：`chat:B08XXX:plan` 和 `chat:B09YYY:plan`
   - 两个会话的记录互不干扰

### 测试 5：验证不同模板独立存储

1. 访问 `/chat.html?tpl=plan&asin=B08XXX&cat=Sports`
2. 发送几条消息
3. 访问 `/chat.html?tpl=ads&asin=B08XXX&cat=Sports`（相同的 ASIN，不同的模板）
4. **预期结果**：
   - 显示的是新会话，没有之前的消息
   - localStorage 中有两个不同的 key：`chat:B08XXX:plan` 和 `chat:B08XXX:ads`
   - 两个模板的记录互不干扰

### 测试 6：验证清空记录功能

1. 在任意会话中发送几条消息
2. 点击页面顶部的"清空记录"按钮
3. 确认弹窗提示
4. **预期结果**：
   - 弹窗显示："确定要清空当前聊天记录吗？"
   - 点击"确定"后：
     - 页面消息清空，显示空状态提示
     - localStorage 中对应的 key 被删除
     - conversationHistory 数组被清空
   - 点击"取消"后：
     - 没有任何变化

### 测试 7：验证导出记录功能

1. 在任意会话中发送几条消息
2. 点击页面顶部的"导出记录"按钮
3. **预期结果**：
   - 浏览器自动下载一个 JSON 文件
   - 文件名格式：`chat-${asin}-${tpl}-${timestamp}.json`
   - 文件内容包含：
     ```json
     {
       "asin": "B08XXX",
       "template": "plan",
       "exportTime": "2024-01-01T12:00:00.000Z",
       "messages": [
         {
           "role": "user",
           "content": "...",
           "ts": 1234567890
         },
         {
           "role": "assistant",
           "content": "...",
           "ts": 1234567891
         }
       ]
     }
     ```
   - JSON 格式正确，可以正常打开查看

### 测试 8：验证无参数时的默认存储

1. 直接访问 `/chat.html`（不带任何参数）
2. 发送几条消息
3. **预期结果**：
   - localStorage 中的 key 为 `chat:default`
   - 刷新页面后，历史记录正常恢复

### 测试 9：验证流式更新时的保存

1. 发送一条消息，等待 AI 流式回复
2. 在回复过程中（边生成边显示时），打开开发者工具查看 localStorage
3. **预期结果**：
   - 在流式更新过程中，localStorage 会实时更新
   - 每次 updateMessage 调用时，都会保存最新的完整内容
   - 最终保存的是完整的回复内容

### 测试 10：验证从产品卡片跳转后的保存

1. 在首页点击产品卡片的"生成产品方案"按钮
2. 等待方案生成完成
3. 刷新页面
4. **预期结果**：
   - 刷新后自动恢复之前生成的方案
   - 可以继续对话，追加新消息
   - localStorage 中保存了完整的对话历史

## 生产环境测试

### 1. 部署到 Vercel
```bash
vercel
# 或通过 Git 推送自动部署
git push origin main
```

### 2. 访问生产环境
- 打开部署后的网站 URL
- 重复上述所有测试步骤

## 验收检查清单

- [ ] 发送消息后，localStorage 中自动保存
- [ ] 刷新页面后，历史记录自动恢复
- [ ] 同一 ASIN 可以续聊（追加新消息）
- [ ] 不同 ASIN 的记录独立存储
- [ ] 不同模板的记录独立存储
- [ ] 清空记录功能正常工作
- [ ] 导出记录功能正常工作，文件格式正确
- [ ] 流式更新时实时保存
- [ ] 从产品卡片跳转后可以正常保存和恢复
- [ ] 无参数时使用默认 key（chat:default）
- [ ] 不保存任何敏感信息（API Key 等）

## 常见问题排查

### 问题：刷新后历史记录没有恢复
**排查步骤**：
1. 打开浏览器开发者工具（F12）→ Application 标签 → Local Storage
2. 检查是否有对应的 key
3. 检查 key 的 value 是否为有效的 JSON
4. 查看 Console 是否有错误信息

### 问题：localStorage 存储失败
**排查步骤**：
1. 检查浏览器是否支持 localStorage
2. 检查是否启用了隐私模式（某些浏览器会限制 localStorage）
3. 查看 Console 是否有存储配额超限的错误

### 问题：导出文件无法打开
**排查步骤**：
1. 检查文件扩展名是否为 `.json`
2. 尝试用文本编辑器打开，检查 JSON 格式是否正确
3. 检查文件内容是否包含完整的消息数据

### 问题：清空记录后还能看到消息
**排查步骤**：
1. 检查是否点击了"取消"而不是"确定"
2. 检查 localStorage 中的 key 是否真的被删除
3. 查看 Console 是否有 JavaScript 错误

## 技术细节说明

### localStorage Key 格式
- 有参数：`chat:${asin}:${tpl}`（例如：`chat:B08XXX:plan`）
- 无参数：`chat:default`

### 存储数据结构
```javascript
[
  {
    role: 'user' | 'assistant',
    content: '消息内容',
    ts: 1234567890 // 时间戳（毫秒）
  }
]
```

### 导出文件格式
```json
{
  "asin": "B08XXX",
  "template": "plan",
  "exportTime": "ISO 8601 格式的时间戳",
  "messages": [
    {
      "role": "user",
      "content": "...",
      "ts": 1234567890
    }
  ]
}
```

### 保存时机
- 用户发送消息时：`addMessage('user', content)` 后立即保存
- AI 回复更新时：`updateMessage()` 每次更新时保存（流式更新）
- 不保存加载中的消息（`isLoading=true`）
