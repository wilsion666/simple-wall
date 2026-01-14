# 页面优化摘要

## 优化目标完成情况

✅ **已完成所有优化目标**

### 1. 模型页面合并
- ✅ 所有 `model-*.html` 文件已合并为 `pages/model.html`
- ✅ 通过 URL 参数 `?m=xxx` 决定展示内容
- ✅ 配置从 `data/catalog/models.json` 加载

### 2. 提示词页面合并
- ✅ 所有 `prompts-*.html` 文件已合并为 `pages/prompts.html`
- ✅ 通过 URL 参数 `?p=xxx` 决定展示内容
- ✅ 配置从 `data/catalog/prompts.json` 加载

### 3. 配置文件创建
- ✅ `data/catalog/models.json` - 模型配置
- ✅ `data/catalog/prompts.json` - 提示词类别配置

### 4. 旧链接兼容
- ✅ `vercel.json` 中已配置所有重定向规则

### 5. 旧文件处理
- ✅ 所有旧文件已移动到 `_backup/` 目录

### 6. 链接更新
- ✅ 所有活动页面中的链接已更新到新地址

## 新的目录结构

```
simple-wall/
├── _backup/                    # 旧文件备份
│   ├── model-*.html
│   ├── prompts-*.html
│   ├── model.html
│   └── prompts.html
├── api/
│   └── chat.js
├── articles/
│   └── index.html
├── data/
│   ├── catalog/                # 配置文件目录
│   │   ├── categories.json
│   │   ├── models.json         # ✨ 新增：模型配置
│   │   └── prompts.json        # ✨ 新增：提示词配置
│   └── csv/
│       ├── categories/
│       ├── 1688.csv
│       └── tiktok.csv
├── docs/
├── images/
├── pages/                      # 所有页面
│   ├── 1688.html
│   ├── chat.html
│   ├── model.html              # ✨ 统一模板页
│   ├── prompts.html            # ✨ 统一模板页
│   └── tiktok.html
├── public/
│   └── images/
├── src/
│   └── js/
├── index.html
└── vercel.json                 # 已更新重定向规则
```

## 重定向规则列表

### 模型页面重定向
| 旧链接 | 新链接 |
|--------|--------|
| `/model-gemini-3.html` | `/pages/model.html?m=gemini-3` |
| `/model-gpt-image-1.5.html` | `/pages/model.html?m=gpt-image-1-5` |
| `/model-nano-banana-pro.html` | `/pages/model.html?m=nano-banana-pro` |
| `/model-seedream-4.5.html` | `/pages/model.html?m=seedream-4-5` |

### 提示词页面重定向
| 旧链接 | 新链接 |
|--------|--------|
| `/prompts-operation.html` | `/pages/prompts.html?p=operation` |
| `/prompts-product.html` | `/pages/prompts.html?p=product` |
| `/prompts-advertising.html` | `/pages/prompts.html?p=advertising` |
| `/prompts-influencer.html` | `/pages/prompts.html?p=influencer` |

### 其他页面重定向
| 旧链接 | 新链接 |
|--------|--------|
| `/1688.html` | `/pages/1688.html` |
| `/tiktok.html` | `/pages/tiktok.html` |
| `/chat.html` | `/pages/chat.html` |

## 配置文件说明

### data/catalog/models.json

```json
[
  {
    "name": "Gemini 3",
    "slug": "gemini-3",
    "storageKey": "model-gemini-3-prompts"
  },
  ...
]
```

**字段说明：**
- `name`: 模型显示名称
- `slug`: URL 参数值（kebab-case）
- `storageKey`: localStorage 存储键名

### data/catalog/prompts.json

```json
[
  {
    "name": "运营",
    "slug": "operation",
    "storageKey": "prompts-operation",
    "hasDefaultPrompts": true
  },
  ...
]
```

**字段说明：**
- `name`: 类别显示名称
- `slug`: URL 参数值（kebab-case）
- `storageKey`: localStorage 存储键名
- `hasDefaultPrompts`: 是否有预设提示词

## 如何新增一个新模型

### 步骤 1：更新 models.json
编辑 `data/catalog/models.json`，添加新模型：

```json
{
  "name": "Claude 3.5",
  "slug": "claude-3-5",
  "storageKey": "model-claude-3-5-prompts"
}
```

### 步骤 2：更新导航链接
在 `pages/model.html` 的导航下拉菜单中添加链接：

```html
<a href="/pages/model.html?m=claude-3-5">Claude 3.5</a>
```

### 步骤 3：添加重定向（可选）
如果需要支持旧链接，在 `vercel.json` 中添加：

```json
{
  "source": "/model-claude-3-5.html",
  "destination": "/pages/model.html?m=claude-3-5",
  "permanent": true
}
```

### 步骤 4：测试
1. 访问 `/pages/model.html?m=claude-3-5`
2. 验证页面标题和内容正确显示
3. 测试添加/编辑/删除提示词功能

## 如何新增一个新的提示词类别

### 步骤 1：更新 prompts.json
编辑 `data/catalog/prompts.json`，添加新类别：

```json
{
  "name": "数据分析",
  "slug": "data-analysis",
  "storageKey": "prompts-data-analysis",
  "hasDefaultPrompts": false
}
```

### 步骤 2：添加预设提示词（可选）
如果 `hasDefaultPrompts: true`，在 `pages/prompts.html` 的 `DEFAULT_PROMPTS_MAP` 中添加：

```javascript
'data-analysis': [
  {
    title: '数据分析提示词1',
    content: '提示词内容...'
  },
  ...
]
```

### 步骤 3：更新导航链接
在 `pages/prompts.html` 的导航下拉菜单中添加链接：

```html
<a href="/pages/prompts.html?p=data-analysis">数据分析</a>
```

### 步骤 4：添加重定向（可选）
如果需要支持旧链接，在 `vercel.json` 中添加：

```json
{
  "source": "/prompts-data-analysis.html",
  "destination": "/pages/prompts.html?p=data-analysis",
  "permanent": true
}
```

### 步骤 5：测试
1. 访问 `/pages/prompts.html?p=data-analysis`
2. 验证页面标题和内容正确显示
3. 测试添加/编辑/删除提示词功能

## 技术实现细节

### 静态 HTML + Fetch API
由于项目是静态 HTML 部署在 Vercel，使用以下方式加载配置：

```javascript
// 加载模型配置
async function loadModelsConfig() {
  const response = await fetch('/data/catalog/models.json');
  MODELS_CONFIG = await response.json();
  // ...
}
```

### 降级处理
如果 JSON 文件加载失败，会降级到硬编码配置，确保页面仍可正常使用。

### localStorage 数据隔离
每个模型/类别使用独立的 `storageKey`，确保数据不会互相干扰。

## 验证清单

- [x] 所有旧文件已移动到 `_backup/` 目录
- [x] `data/catalog/models.json` 已创建并配置正确
- [x] `data/catalog/prompts.json` 已创建并配置正确
- [x] `pages/model.html` 从 JSON 加载配置
- [x] `pages/prompts.html` 从 JSON 加载配置
- [x] `vercel.json` 包含所有重定向规则
- [x] 所有活动页面链接已更新
- [x] 旧链接通过重定向正常工作

## 注意事项

1. **JSON 文件路径**：确保 JSON 文件路径正确，使用 `/data/catalog/xxx.json`（绝对路径）

2. **URL 参数**：模型使用 `?m=xxx`，提示词使用 `?p=xxx`

3. **预设提示词**：目前预设提示词仍硬编码在 `pages/prompts.html` 中，如需完全配置化，可创建单独的 JSON 文件

4. **向后兼容**：所有旧链接通过 `vercel.json` 重定向到新地址，无需担心 SEO 影响

5. **备份文件**：旧文件已移动到 `_backup/` 目录，确认一切正常后可删除
