/**
 * 利润计算工具
 * 
 * 用于计算产品的利润指标和决策建议
 */

// 利润率阈值常量
const PROFIT_THRESHOLD_HIGH = 0.15;  // 15% 及以上：做
const PROFIT_THRESHOLD_LOW = 0.12;   // 12% 以下：不做

/**
 * 计算利润指标
 * 
 * @param {Object} params - 计算参数
 * @param {number} params.priceUsd - 售价S (USD)
 * @param {number} params.asinMarginPct - Amazon费用后毛利率（小数，如0.48）
 * @param {number} params.productCostRmb - 产品成本（RMB）
 * @param {number} params.shippingCostRmb - 物流成本（RMB）
 * @param {number} params.fx - 汇率（RMB per USD，例如7.1表示1美元=7.1人民币）
 * @param {number} params.adPct - 广告费占比（小数，如0.12）
 * @param {number} params.refundPct - 退款占比（小数，如0.03）
 * @returns {Object} 利润指标对象，失败时返回包含error字段的对象
 */
function calcProfitMetrics({
  priceUsd,
  asinMarginPct,
  productCostRmb,
  shippingCostRmb,
  fx,
  adPct,
  refundPct
}) {
  // 参数验证
  if (!priceUsd || priceUsd <= 0) {
    return { error: '售价无效或为空' };
  }
  
  // 汇率验证（避免除零和极小值导致成本爆炸）
  if (!fx || fx <= 0 || !Number.isFinite(fx)) {
    return { error: '汇率必须大于0' };
  }
  
  // 验证毛利率参数（避免NaN传播）
  if (asinMarginPct == null || isNaN(asinMarginPct) || asinMarginPct < 0) {
    return { error: 'Amazon毛利率无效' };
  }

  // 转换成本为USD
  const productCostUsd = (productCostRmb || 0) / fx;
  const shippingCostUsd = (shippingCostRmb || 0) / fx;

  // 计算成本占比
  const productCostPct = productCostUsd / priceUsd;
  const shippingCostPct = shippingCostUsd / priceUsd;

  // Amazon费用后毛利
  const amazonMarginUsd = priceUsd * (asinMarginPct || 0);
  const amazonMarginPct = asinMarginPct || 0;

  // 其他费用
  const adUsd = priceUsd * (adPct || 0);
  const refundUsd = priceUsd * (refundPct || 0);

  // 最终利润
  const profitUsd = amazonMarginUsd - productCostUsd - shippingCostUsd - adUsd - refundUsd;
  const profitPct = profitUsd / priceUsd;

  // 决策建议
  let verdict;
  if (profitPct >= PROFIT_THRESHOLD_HIGH) {
    verdict = '✅ 做';
  } else if (profitPct > PROFIT_THRESHOLD_LOW) {
    verdict = '⚠️ 讨论';
  } else {
    verdict = '❌ 不做';
  }

  return {
    // 成本占比
    productCostPct,
    shippingCostPct,
    
    // Amazon费用后毛利
    amazonMarginUsd,
    amazonMarginPct,
    
    // 其他成本
    productCostUsd,
    shippingCostUsd,
    adUsd,
    refundUsd,
    
    // 最终利润
    profitUsd,
    profitPct,
    
    // 决策建议
    verdict
  };
}

/**
 * 格式化USD金额
 * @param {number} value - 金额
 * @returns {string} 格式化后的字符串
 */
function formatUsd(value) {
  if (value == null || isNaN(value)) {
    return '--';
  }
  return '$' + value.toFixed(2);
}

/**
 * 格式化百分比
 * @param {number} value - 小数值（如0.48）
 * @returns {string} 格式化后的字符串
 */
function formatPct(value) {
  if (value == null || isNaN(value)) {
    return '--';
  }
  const pct = value * 100;
  if (pct === 0) return '0%';
  // 对于非常小的百分比，显示更多位数避免误导
  if (Math.abs(pct) < 0.01) {
    return pct.toFixed(4) + '%';
  }
  return pct.toFixed(2) + '%';
}

/**
 * 解析毛利率字符串（智能识别百分号和小数）
 * @param {string} marginStr - 毛利率字符串（支持 "48%", "0.48", "48"）
 * @returns {number} 小数值（如 0.48）
 */
function parseMarginPct(marginStr) {
  if (!marginStr) return 0;
  const str = String(marginStr).trim();
  
  // 如果包含%符号，去掉后除以100
  if (str.includes('%')) {
    const cleanStr = str.replace('%', '').trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num / 100;
  }
  
  // 如果没有%，判断是小数(0-1)还是百分数(>1)
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  // 如果大于1，认为是百分数形式（如48表示48%）
  // 如果0-1之间，认为已经是小数形式（如0.48）
  return num > 1 ? num / 100 : num;
}
