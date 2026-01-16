/**
 * ChatModal - 与AI对话弹窗组件
 * 包含: Header/MessageList/InputBar 布局
 * 模型选择: GPT5.2/Gemini 3/Claude/deepseek R1
 */

class ChatModal {
  constructor() {
    this.isOpen = false;
    this.currentModel = 'gpt-5.2';
    this.isGenerating = false;
    this.messages = [];
    this.init();
  }

  init() {
    this.createModal();
    this.attachEvents();
  }

  createModal() {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'chat-modal-overlay';
    overlay.id = 'chatModalOverlay';
    
    // 创建弹窗容器
    const modal = document.createElement('div');
    modal.className = 'chat-modal';
    modal.id = 'chatModal';
    
    modal.innerHTML = `
      <div class="chat-modal-header">
        <div class="chat-modal-title">
          <h3>与AI对话</h3>
          <div class="model-select-wrapper">
            <select id="modelSelect" class="model-select">
              <option value="gpt-5.2">GPT-5.2</option>
              <option value="gemini-3">Gemini 3</option>
              <option value="claude">Claude</option>
              <option value="deepseek-r1">DeepSeek R1</option>
            </select>
          </div>
        </div>
        <button class="chat-modal-close" id="chatModalClose">×</button>
      </div>
      
      <div class="chat-modal-body">
        <div class="chat-messages" id="chatMessages">
          <div class="empty-state">开始对话吧！在下方输入消息...</div>
        </div>
      </div>
      
      <div class="chat-modal-footer">
        <div class="chat-input-wrapper">
          <textarea 
            id="chatInput" 
            class="chat-input" 
            placeholder="输入消息..." 
            rows="1"
          ></textarea>
          <button id="chatSendBtn" class="chat-send-btn">发送</button>
        </div>
        <div class="chat-error" id="chatError"></div>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // 注入样式
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* 遮罩层 */
      .chat-modal-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
      }
      
      .chat-modal-overlay.show {
        display: flex;
      }
      
      /* 弹窗容器 */
      .chat-modal {
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: chatModalSlideIn 0.3s ease-out;
      }
      
      @keyframes chatModalSlideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      /* Header */
      .chat-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #eee;
        background: #fff;
      }
      
      .chat-modal-title {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
      }
      
      .chat-modal-title h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #111;
      }
      
      .model-select-wrapper {
        position: relative;
      }
      
      .model-select {
        padding: 6px 32px 6px 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #fff;
        font-size: 14px;
        color: #333;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
        transition: all 0.2s;
      }
      
      .model-select:hover:not(:disabled) {
        border-color: #0066cc;
      }
      
      .model-select:focus {
        outline: none;
        border-color: #0066cc;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }
      
      .model-select:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: #f5f5f5;
      }
      
      .chat-modal-close {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        font-size: 24px;
        color: #999;
        cursor: pointer;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        padding: 0;
        line-height: 1;
      }
      
      .chat-modal-close:hover {
        background: #f5f5f5;
        color: #333;
      }
      
      /* Body - Messages */
      .chat-modal-body {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: #fafafa;
      }
      
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .chat-message {
        display: flex;
        gap: 12px;
        animation: chatMessageFadeIn 0.3s ease-out;
      }
      
      @keyframes chatMessageFadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .chat-message.user {
        flex-direction: row-reverse;
      }
      
      .chat-message-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
      }
      
      .chat-message.user .chat-message-avatar {
        background: #111;
        color: #fff;
      }
      
      .chat-message.assistant .chat-message-avatar {
        background: #0066cc;
        color: #fff;
      }
      
      .chat-message-content {
        flex: 1;
        background: #fff;
        padding: 12px 16px;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        line-height: 1.6;
        color: #333;
        white-space: pre-wrap;
        word-wrap: break-word;
        max-width: 80%;
      }
      
      .chat-message.user .chat-message-content {
        background: #111;
        color: #fff;
      }
      
      .chat-message.loading .chat-message-content {
        color: #999;
        font-style: italic;
      }
      
      .empty-state {
        text-align: center;
        color: #999;
        padding: 60px 20px;
        font-size: 16px;
      }
      
      /* Footer - Input */
      .chat-modal-footer {
        padding: 16px 20px;
        border-top: 1px solid #eee;
        background: #fff;
      }
      
      .chat-input-wrapper {
        display: flex;
        gap: 10px;
        align-items: flex-end;
      }
      
      .chat-input {
        flex: 1;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        min-height: 44px;
        max-height: 120px;
        line-height: 1.5;
        transition: border-color 0.2s;
      }
      
      .chat-input:focus {
        outline: none;
        border-color: #0066cc;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }
      
      .chat-input:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
      }
      
      .chat-send-btn {
        padding: 12px 24px;
        background: #111;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
        white-space: nowrap;
      }
      
      .chat-send-btn:hover:not(:disabled) {
        background: #333;
      }
      
      .chat-send-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      
      .chat-error {
        margin-top: 8px;
        padding: 8px 12px;
        background: #fee;
        color: #c00;
        border-radius: 6px;
        font-size: 13px;
        display: none;
      }
      
      .chat-error.show {
        display: block;
      }
      
      /* 响应式 */
      @media (max-width: 768px) {
        .chat-modal {
          width: 100%;
          max-width: 100%;
          max-height: 100vh;
          border-radius: 0;
        }
        
        .chat-modal-header {
          padding: 12px 16px;
        }
        
        .chat-modal-title {
          gap: 12px;
        }
        
        .chat-modal-title h3 {
          font-size: 16px;
        }
        
        .model-select {
          font-size: 13px;
          padding: 6px 28px 6px 10px;
        }
        
        .chat-messages {
          padding: 16px;
        }
        
        .chat-modal-footer {
          padding: 12px 16px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  attachEvents() {
    const overlay = document.getElementById('chatModalOverlay');
    const closeBtn = document.getElementById('chatModalClose');
    const modelSelect = document.getElementById('modelSelect');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');

    // 关闭按钮
    closeBtn.addEventListener('click', () => this.close());

    // 点击遮罩层关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // 模型选择
    modelSelect.addEventListener('change', (e) => {
      if (this.isGenerating) {
        // 生成中不允许切换
        e.preventDefault();
        this.showError('生成中，无法切换模型');
        modelSelect.value = this.currentModel;
        return;
      }
      
      const newModel = e.target.value;
      if (newModel !== this.currentModel) {
        this.onModelChange(newModel);
      }
    });

    // 发送按钮
    sendBtn.addEventListener('click', () => this.sendMessage());

    // Enter发送，Shift+Enter换行
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 自动调整输入框高度
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }

  open() {
    this.isOpen = true;
    const overlay = document.getElementById('chatModalOverlay');
    overlay.classList.add('show');
    
    // 聚焦输入框
    setTimeout(() => {
      const input = document.getElementById('chatInput');
      input.focus();
    }, 100);
  }

  close() {
    this.isOpen = false;
    const overlay = document.getElementById('chatModalOverlay');
    overlay.classList.remove('show');
  }

  onModelChange(newModel) {
    const oldModel = this.currentModel;
    this.currentModel = newModel;
    
    // 提示用户模型已切换
    this.showInfo(`已切换到 ${this.getModelName(newModel)}`);
    
    // 如果当前有对话历史，可以询问是否清空
    if (this.messages.length > 0) {
      const shouldClear = confirm(
        `已切换到 ${this.getModelName(newModel)}。\n\n切换模型后，之前的对话上下文可能不适用。是否清空当前对话？`
      );
      
      if (shouldClear) {
        this.clearMessages();
      }
    }
  }

  getModelName(model) {
    const names = {
      'gpt-5.2': 'GPT-5.2',
      'gemini-3': 'Gemini 3',
      'claude': 'Claude',
      'deepseek-r1': 'DeepSeek R1'
    };
    return names[model] || model;
  }

  addMessage(role, content, isLoading = false) {
    const messagesEl = document.getElementById('chatMessages');
    
    // 移除空状态
    const emptyState = messagesEl.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role} ${isLoading ? 'loading' : ''}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'chat-message-avatar';
    avatar.textContent = role === 'user' ? '你' : 'AI';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'chat-message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesEl.appendChild(messageDiv);
    
    // 滚动到底部
    this.scrollToBottom();
    
    // 保存消息
    if (!isLoading && content) {
      this.messages.push({ role, content, timestamp: Date.now() });
    }
    
    return messageDiv;
  }

  updateMessage(messageDiv, content) {
    const contentDiv = messageDiv.querySelector('.chat-message-content');
    if (contentDiv) {
      contentDiv.textContent = content;
      messageDiv.classList.remove('loading');
      this.scrollToBottom();
      
      // 更新最后一条消息
      if (this.messages.length > 0) {
        const lastMsg = this.messages[this.messages.length - 1];
        if (lastMsg.role === 'assistant') {
          lastMsg.content = content;
        }
      }
    }
  }

  clearMessages() {
    this.messages = [];
    const messagesEl = document.getElementById('chatMessages');
    messagesEl.innerHTML = '<div class="empty-state">开始对话吧！在下方输入消息...</div>';
  }

  scrollToBottom() {
    const messagesEl = document.getElementById('chatMessages');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  showError(message) {
    const errorEl = document.getElementById('chatError');
    errorEl.textContent = message;
    errorEl.classList.add('show');
    
    setTimeout(() => {
      errorEl.classList.remove('show');
    }, 3000);
  }

  showInfo(message) {
    // 简单的提示，可以用toast替代
    console.log('[ChatModal]', message);
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const modelSelect = document.getElementById('modelSelect');
    const message = input.value.trim();
    
    if (!message) return;
    if (this.isGenerating) return;

    // 禁用输入和按钮
    this.isGenerating = true;
    input.disabled = true;
    sendBtn.disabled = true;
    modelSelect.disabled = true;
    this.hideError();

    // 添加用户消息
    this.addMessage('user', message);
    input.value = '';
    input.style.height = 'auto';

    // 添加AI消息占位
    const aiMessage = this.addMessage('assistant', '', true);
    this.messages.push({ role: 'assistant', content: '', timestamp: Date.now() });
    
    let fullReply = '';

    try {
      // 调用mock API
      const response = await fetch('/api/chat-mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: this.messages.filter(m => m.content),
          model: this.currentModel
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/event-stream')) {
        // 非流式响应
        const data = await response.json();
        const reply = data.reply || '无回复内容';
        this.updateMessage(aiMessage, reply);
        return;
      }

      // 流式读取
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              aiMessage.classList.remove('loading');
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullReply += parsed.content;
                this.updateMessage(aiMessage, fullReply);
              }
            } catch (e) {
              console.warn('[ChatModal] Failed to parse SSE data:', e);
            }
          }
        }
      }

      // 处理剩余buffer
      if (buffer.trim()) {
        const line = buffer.trim();
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullReply += parsed.content;
                this.updateMessage(aiMessage, fullReply);
              }
            } catch (e) {
              console.warn('[ChatModal] Failed to parse final SSE data:', e);
            }
          }
        }
      }

      if (!fullReply) {
        aiMessage.remove();
        this.messages.pop();
        this.showError('未收到回复内容');
      } else {
        aiMessage.classList.remove('loading');
      }

    } catch (error) {
      aiMessage.remove();
      this.messages.pop();
      this.showError(`错误: ${error.message}`);
      console.error('[ChatModal] Error:', error);
    } finally {
      this.isGenerating = false;
      input.disabled = false;
      sendBtn.disabled = false;
      modelSelect.disabled = false;
      input.focus();
    }
  }

  hideError() {
    const errorEl = document.getElementById('chatError');
    errorEl.classList.remove('show');
  }
}

// 导出单例
window.ChatModal = ChatModal;
