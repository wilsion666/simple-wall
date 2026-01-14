# SIMPLE-WALL 重构摘要

## 重构后的目录结构

```
simple-wall/
├── api/                    # API 接口
│   └── chat.js
├── articles/               # 文章目录
│   └── index.html
├── data/                   # 数据目录
│   ├── catalog/            # 配置文件
│   │   └── categories.json # 类目配置文件
│   └── csv/                # CSV 数据文件
│       ├── categories/     # 类目 CSV（kebab-case 命名）
│       │   ├── industrial-scientific.csv
│       │   ├── musical-instruments.csv
│       │   ├── office-products.csv
│       │   ├── patio-lawn-garden.csv
│       │   ├── pet-supplies.csv
│       │   ├── sports-outdoors.csv
│       │   ├── tools-home-improvement.csv
│       │   └── toys-games.csv
│       ├── 1688.csv
│       └── tiktok.csv
├── docs/                   # 文档目录
│   ├── ENV_SETUP.md
│   ├── TEST_CHAT_HISTORY.md
│   ├── TEST_STEPS.md
│   └── TEST_TEMPLATE_FEATURE.md
├── images/                 # 图片资源（保留原位置）
│   ├── 1688/
│   ├── Industrial & Scientific/
│   ├── Musical Instruments/
│   ├── Office Products/
│   ├── Patio, Lawn & Garden/
│   ├── Pet Supplies/
│   ├── Sports & Outdoors/
│   ├── Tools & Home Improvement/
│   ├── Toys & Games/
│   └── tiktok/
├── pages/                   # 页面目录
│   ├── 1688.html
│   ├── chat.html
│   ├── model.html          # 统一的大模型模板页（通过 ?m=xxx 参数）
│   ├── prompts.html        # 统一的提示词模板页（通过 ?p=xxx 参数）
│   └── tiktok.html
├── public/                 # 公共资源目录
│   └── images/
├── src/                    # 源代码目录
│   └── js/
├── index.html              # 首页（已更新 CSV 路径）
└── vercel.json             # Vercel 配置（已更新路由和重定向）
```

## 改动摘要

### 1. 文件移动和重命名

#### CSV 文件
- ✅ 所有类目 CSV 文件从根目录移动到 `data/csv/categories/`
- ✅ 文件名转换为 kebab-case：
  - `Industrial & Scientific.csv` → `industrial-scientific.csv`
  - `Musical Instruments.csv` → `musical-instruments.csv`
  - `Office Products.csv` → `office-products.csv`
  - `Patio, Lawn & Garden.csv` → `patio-lawn-garden.csv`
  - `Pet Supplies.csv` → `pet-supplies.csv`
  - `Sports & Outdoors.csv` → `sports-outdoors.csv`
  - `Tools & Home Improvement.csv` → `tools-home-improvement.csv`
  - `Toys & Games.csv` → `toys-games.csv`
- ✅ `1688.csv` 和 `TIKTOK.csv` 移动到 `data/csv/`（重命名为 `tiktok.csv`）

#### HTML 文件
- ✅ `1688.html`, `tiktok.html`, `chat.html` → `pages/`
- ✅ `model-*.html` 合并为 `pages/model.html`（模板页）
- ✅ `prompts-*.html` 合并为 `pages/prompts.html`（模板页）

#### 文档文件
- ✅ `ENV_SETUP.md`, `TEST_*.md` → `docs/`

### 2. 新增文件

- ✅ `data/catalog/categories.json` - 类目配置文件
- ✅ `pages/model.html` - 统一的大模型模板页
- ✅ `pages/prompts.html` - 统一的提示词模板页

### 3. 路径引用更新

#### index.html
- ✅ CSV 路径更新为 `data/csv/categories/xxx.csv`
- ✅ 导航链接更新为新的模板页路径

#### 所有页面
- ✅ 更新了所有页面中的导航链接：
  - `/model-*.html` → `/pages/model.html?m=xxx`
  - `/prompts-*.html` → `/pages/prompts.html?p=xxx`
  - `/1688.html` → `/pages/1688.html`
  - `/tiktok.html` → `/pages/tiktok.html`
  - `/chat.html` → `/pages/chat.html`

### 4. Vercel 配置更新

#### vercel.json
- ✅ 添加了重定向规则（redirects）：
  - 旧链接自动重定向到新模板页
  - 例如：`/model-gemini-3.html` → `/pages/model.html?m=gemini-3`
- ✅ 更新了 rewrites 规则

### 5. 模板页功能

#### pages/model.html
- 通过 URL 参数 `?m=xxx` 加载不同模型：
  - `gemini-3` → Gemini 3
  - `gpt-image-1-5` → GPT Image 1.5
  - `nano-banana-pro` → Nano Banana Pro
  - `seedream-4-5` → Seedream 4.5

#### pages/prompts.html
- 通过 URL 参数 `?p=xxx` 加载不同类别：
  - `operation` → 运营（含预设提示词）
  - `product` → 产品开发（含预设提示词）
  - `advertising` → 广告
  - `influencer` → 红人

### 6. 待清理文件（可选）

以下文件已不再需要，可以删除：
- `model-gemini-3.html`
- `model-gpt-image-1.5.html`
- `model-nano-banana-pro.html`
- `model-seedream-4.5.html`
- `model.html`（根目录）
- `prompts-operation.html`
- `prompts-product.html`
- `prompts-advertising.html`
- `prompts-influencer.html`
- `prompts.html`（根目录）

**注意**：这些文件已通过 `vercel.json` 重定向到新模板页，删除前请确认所有访问都已迁移。

## 如何新增一个类目

### 步骤 1：准备 CSV 文件
1. 将 CSV 文件命名为 kebab-case 格式（例如：`home-kitchen.csv`）
2. 将文件放到 `data/csv/categories/` 目录

### 步骤 2：更新 categories.json
编辑 `data/catalog/categories.json`，添加新类目：

```json
{
  "name": "Home & Kitchen",
  "slug": "home-kitchen",
  "csvPath": "data/csv/categories/home-kitchen.csv",
  "imageDir": "images/Home & Kitchen"
}
```

### 步骤 3：更新 index.html
在 `index.html` 的 `CATEGORIES` 数组中添加：

```javascript
{ 
  key: "home-kitchen", 
  name: "Home & Kitchen", 
  csv: "data/csv/categories/home-kitchen.csv", 
  imgDir: "images/Home & Kitchen" 
}
```

### 步骤 4：准备图片目录（可选）
如果该类目有产品图片，确保 `images/Home & Kitchen/` 目录存在并包含图片文件。

### 步骤 5：测试
1. 访问首页，检查下拉菜单中是否出现新类目
2. 选择新类目，验证 CSV 数据是否正确加载
3. 检查图片是否正确显示

## 部署到 Vercel

重构后的项目可以直接部署到 Vercel，所有路由和重定向规则已在 `vercel.json` 中配置完成。

### 验证清单
- [ ] 所有 CSV 文件路径正确
- [ ] 所有页面链接更新
- [ ] vercel.json 配置正确
- [ ] 模板页 URL 参数正常工作
- [ ] 旧链接重定向正常

## 注意事项

1. **localStorage 数据**：模板页使用 localStorage 存储提示词，不同类别的数据通过不同的 key 区分，不会互相干扰。

2. **图片路径**：图片目录路径保持原样（`images/类目名/`），因为图片文件名可能包含特殊字符，需要保持原始目录结构。

3. **向后兼容**：通过 `vercel.json` 的重定向规则，旧的 URL 链接仍然可以访问，会自动跳转到新的模板页。

4. **CSV 编码**：确保 CSV 文件使用 UTF-8 编码，代码中已处理 BOM 标记。
