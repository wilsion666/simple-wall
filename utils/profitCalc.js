/**
 * 利润计算工具
 * 
 * 用于计算产品的利润指标和决策建议
 */

/**
 * 计算利润指标
 * 
 * @param {Object} params - 计算参数
 * @param {number} params.priceUsd - 售价S (USD)
 * @param {number} params.asinMarginPct - Amazon费用后毛利率（小数，如0.48）
 * @param {number} params.productCostRmb - 产品成本（RMB）
 * @param {number} params.shippingCostRmb - 物流成本（RMB）
 * @param {number} params.fx - 汇率
 * @param {number} params.adPct - 广告费占比（小数，如0.12）
 * @param {number} params.refundPct - 退款占比（小数，如0.03）
 * @returns {Object} 利润指标对象
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
    return null;
  }

  // 转换成本为USD
  const productCostUsd = (productCostRmb || 0) / (fx || 1);
  const shippingCostUsd = (shippingCostRmb || 0) / (fx || 1);

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
  if (profitPct >= 0.15) {
    verdict = '✅ 做';
  } else if (profitPct > 0.12) {
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
  return (value * 100).toFixed(2) + '%';
}

/**
 * 解析毛利率字符串
 * @param {string} marginStr - 毛利率字符串（如 "48%"）
 * @returns {number} 小数值（如 0.48）
 */
function parseMarginPct(marginStr) {
  if (!marginStr) return 0;
  const cleanStr = String(marginStr).replace('%', '').trim();
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num / 100;
}
