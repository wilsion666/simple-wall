# 🔍 利润计算功能调试指南

## 问题现象
点击"利润计算"按钮后，显示"AI 输出区域（预留）"而不是利润计算表单。

## 已添加的调试日志

我已经在代码中添加了详细的调试日志，帮助诊断问题。

### 第1步：打开浏览器控制台

1. 按 `F12` 打开开发者工具
2. 切换到 `Console`（控制台）标签
3. **清空控制台**（点击🚫图标或按 Ctrl+L）

### 第2步：刷新页面

**重要！** 必须硬刷新以清除缓存：
- Windows: `Ctrl + Shift + R` 或 `Ctrl + F5`
- Mac: `Cmd + Shift + R`

### 第3步：检查脚本加载日志

刷新后，控制台应该显示：

```
✅ 正常情况：
[profitCalc.js] 脚本开始加载...
[profitCalc.js] 常量已定义
[profitCalc.js] 所有函数已定义完成
[profitCalc.js] calcProfitMetrics: function
[profitCalc.js] formatUsd: function
[profitCalc.js] formatPct: function
[profitCalc.js] parseMarginPct: function
```

❌ **如果看不到这些日志**，说明：
- **问题：** `profitCalc.js` 文件未加载或路径错误
- **解决：** 检查文件路径是否为 `/utils/profitCalc.js`

### 第4步：点击"利润计算"按钮

点击任意产品的"利润计算"按钮，控制台应该显示：

```
✅ 正常情况：
[DEBUG] 触发利润计算，action: profitCalc
[DEBUG] 产品数据: {asin: "B0XXX", price: "12.99", ...}
[DEBUG] 开始渲染利润计算界面...
[renderProfitCalc] 开始渲染，产品: B0XXX
[renderProfitCalc] 解析价格: 12.99
[renderProfitCalc] 解析毛利率: 48% -> 0.48
[renderProfitCalc] HTML 已注入，UID: profit_1737xxxxxxx
[DEBUG] 利润计算界面渲染完成
[renderProfitCalc] 开始绑定计算逻辑...
[renderProfitCalc] 计算逻辑绑定完成
```

### 可能的错误情况

#### 错误1：看不到 `[DEBUG] 触发利润计算` 日志

**原因：** 浏览器缓存，HTML 文件未更新  
**解决：**
1. 按 `Ctrl + Shift + Delete` 打开清除缓存对话框
2. 选择"缓存的图片和文件"
3. 点击"清除数据"
4. 再次硬刷新页面

#### 错误2：看到 `[ERROR] parseMarginPct 函数未定义`

**原因：** `profitCalc.js` 文件未正确加载  
**解决：**
1. 打开 Network 标签
2. 刷新页面
3. 搜索 `profitCalc.js`
4. 检查状态码是否为 200（如果是404，说明文件路径错误）

#### 错误3：看到 JavaScript 报错（红色）

**原因：** 代码执行出错  
**解决：**
1. 截图完整的错误信息
2. 检查错误发生在哪个文件的哪一行
3. 报告给开发者

### 第5步：验证修复成功

如果一切正常，应该看到：

**在页面上：**
- ✅ 模态框标题："利润计算"
- ✅ 产品信息区：ASIN、售价、Amazon毛利率
- ✅ 输入表单：产品成本、物流成本、汇率、广告费占比、退款占比
- ✅ 提示文字："请输入成本信息开始计算"

**在控制台：**
- ✅ 所有 `[DEBUG]` 和 `[renderProfitCalc]` 日志都正常显示
- ❌ **没有红色错误信息**

## 快速诊断流程图

```
开始
  ↓
打开控制台（F12）
  ↓
硬刷新页面（Ctrl+Shift+R）
  ↓
看到 [profitCalc.js] 日志？
  ├─ 否 → profitCalc.js 未加载 → 检查文件路径
  └─ 是 ↓
点击"利润计算"按钮
  ↓
看到 [DEBUG] 触发利润计算？
  ├─ 否 → HTML 缓存 → 清除浏览器缓存
  └─ 是 ↓
看到红色错误？
  ├─ 是 → 代码执行出错 → 报告错误信息
  └─ 否 ↓
页面显示输入表单？
  ├─ 是 → ✅ 修复成功！
  └─ 否 → 仍显示占位符 → 联系开发者
```

## 常见问题排查

### Q1: 刷新多次还是不行？
**A:** 尝试以下步骤：
1. 关闭所有该网站的标签页
2. 清除浏览器缓存（Ctrl+Shift+Delete）
3. 关闭浏览器
4. 重新打开浏览器
5. 访问网站

### Q2: 控制台显示 404 错误？
**A:** 说明文件路径不正确，检查：
- 文件是否存在：`c:\Users\Admin\Documents\GitHub\simple-wall\utils\profitCalc.js`
- Web 服务器是否正确映射 `/utils/` 路径

### Q3: 控制台没有任何日志？
**A:** 检查：
1. 是否真的硬刷新了（不是普通刷新）
2. Console 标签的过滤器是否设置为显示所有日志（不要勾选"Hide network"）
3. 浏览器是否禁用了 JavaScript

## 需要报告的信息

如果问题依然存在，请提供：
1. **控制台截图**（包含所有日志和错误）
2. **Network 标签截图**（显示 profitCalc.js 的加载状态）
3. **浏览器版本**（Chrome/Edge/Firefox + 版本号）
4. **是否使用了代理或防火墙**
