// Currency and number formatting utilities
const CURRENCY_LOCALE = 'vi-VN';
const CURRENCY_CODE = 'VND';

/**
 * Format number as Vietnamese Dong currency
 */
export const formatCurrency = (amount: number | string, options?: {
  showSign?: boolean;
  compact?: boolean;
  showSymbol?: boolean;
}): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0 ₫';
  }
  
  const { showSign = false, compact = false, showSymbol = true } = options || {};
  
  let formatted: string;
  
  if (compact && Math.abs(numAmount) >= 1000000) {
    // Compact format for millions
    const millions = numAmount / 1000000;
    formatted = `${millions.toFixed(1).replace('.0', '')}M`;
  } else if (compact && Math.abs(numAmount) >= 1000) {
    // Compact format for thousands
    const thousands = numAmount / 1000;
    formatted = `${thousands.toFixed(0)}K`;
  } else {
    // Full format
    formatted = new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: CURRENCY_CODE,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  }
  
  // Add sign if requested
  if (showSign && numAmount > 0) {
    formatted = `+${formatted}`;
  }
  
  // Add symbol for compact format
  if (compact && showSymbol) {
    formatted = `${formatted} ₫`;
  }
  
  return formatted;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '0';
  }
  
  return new Intl.NumberFormat(CURRENCY_LOCALE).format(num);
};

/**
 * Parse Vietnamese currency string to number
 */
export const parseCurrency = (value: string): number => {
  // Remove currency symbols and spaces
  const cleaned = value
    .replace(/[₫đVNDvnd\s]/gi, '')
    .replace(/[,\.]/g, '');
  
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
};

/**
 * Format percentage
 */
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calculate percentage change
 */
export const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
};

/**
 * Format large numbers in short form
 */
export const formatShortNumber = (num: number): string => {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1000000000) {
    return sign + (absNum / 1000000000).toFixed(1).replace('.0', '') + 'B';
  }
  if (absNum >= 1000000) {
    return sign + (absNum / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (absNum >= 1000) {
    return sign + (absNum / 1000).toFixed(1).replace('.0', '') + 'K';
  }
  return sign + absNum.toString();
};
