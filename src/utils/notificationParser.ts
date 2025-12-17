// Notification Parser for Vietnamese Banking Apps
// Extracts transaction data from notification text

import { BankNotification, ParsedTransaction, getBankByPackage, BankCode } from '../types';
import { TransactionCategory } from '../types/transaction';

// Common Vietnamese amount patterns
const AMOUNT_PATTERNS = [
  // Pattern: -50,000 VND or +50,000 VND
  /([+-]?)[\s]*([\d,\.]+)\s*(?:VND|VNĐ|đ|đồng)/i,
  // Pattern: 50,000 VND or 50.000 VND
  /([\d,\.]+)\s*(?:VND|VNĐ|đ|đồng)/i,
  // Pattern: số tiền: 50,000
  /(?:số tiền|so tien|amount)[\s:]+([+-]?[\d,\.]+)/i,
  // Pattern: GD: -50,000
  /(?:GD|giao dịch|giao dich)[\s:]*([+-]?[\d,\.]+)/i,
];

// Transaction type indicators
const EXPENSE_KEYWORDS = [
  'thanh toán', 'thanh toan', 'chi', 'trừ', 'tru', 
  'chuyển đi', 'chuyen di', 'rút', 'rut', 'mua',
  'gd:', '-', 'thanh toán qr', 'payment', 'withdraw'
];

const INCOME_KEYWORDS = [
  'nhận', 'nhan', 'vào', 'vao', 'tiền vào', 'tien vao',
  'cộng', 'cong', 'chuyển đến', 'chuyen den', '+',
  'nạp', 'nap', 'received', 'deposit', 'salary', 'lương'
];

// Merchant/Location patterns
const MERCHANT_PATTERNS = [
  /(?:tại|tai|at)\s+(.+?)(?:\s+(?:lúc|luc|vào|vao|ngày|ngay)|$)/i,
  /(?:từ|tu|from)\s+(.+?)(?:\s+(?:lúc|luc|vào|vao)|$)/i,
  /(?:đến|den|to)\s+(.+?)(?:\s+(?:lúc|luc|vào|vao)|$)/i,
  /(?:nơi giao dịch|noi giao dich)[\s:]+(.+?)(?:\s+(?:lúc|luc)|$)/i,
];

// Time patterns
const TIME_PATTERNS = [
  /(?:lúc|luc|vào|vao|time)[\s:]+(\d{1,2}:\d{2}(?::\d{2})?)/i,
  /(\d{1,2}:\d{2}(?::\d{2})?)\s+(?:ngày|ngay|\d{1,2}\/)/i,
  /(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}:\d{2})/i,
];

// Advertisement/Promotional notification keywords to filter out
const ADVERTISEMENT_KEYWORDS = [
  // Vietnamese promotional keywords
  'khuyến mãi', 'khuyen mai', 'ưu đãi', 'uu dai',
  'giảm giá', 'giam gia', 'sale', 'promotion',
  'miễn phí', 'mien phi', 'free', 'không phí', 'khong phi',
  'hoàn tiền', 'hoan tien', 'cashback',
  'tặng', 'tang', 'quà tặng', 'qua tang',
  'đặc quyền', 'dac quyen', 'privilege',
  'thẻ tín dụng', 'the tin dung', 'credit card',
  'đăng ký', 'dang ky', 'register', 'sign up',
  'mở thẻ', 'mo the', 'apply card',
  'flash sale', 'hot deal', 'deal sốc', 'deal soc',
  'voucher', 'coupon', 'mã giảm', 'ma giam',
  'tận hưởng', 'tan huong', 'trải nghiệm', 'trai nghiem',
  'chương trình', 'chuong trinh', 'program',
  'sự kiện', 'su kien', 'event',
  'thả ga', 'tha ga', 'không lo', 'khong lo',
  'du lịch', 'du lich', 'travel',
  'mua sắm', 'mua sam',
  'điểm thưởng', 'diem thuong', 'reward points',
  'tích điểm', 'tich diem', 'earn points',
  'JCB', 'Visa Platinum', 'Mastercard Gold',
  'liên kết', 'lien ket', 'link',
  'kích hoạt', 'kich hoat', 'activate',
  '0%', '0 đồng', '0đ', '0 dong',
  'trúng thưởng', 'trung thuong', 'win',
  'quay số', 'quay so', 'lucky draw',
  'nâng cấp', 'nang cap', 'upgrade',
  'vay', 'loan', 'tín dụng', 'tin dung',
  'gói dịch vụ', 'goi dich vu', 'service package',
];

// Keywords that indicate it's NOT an ad even if other ad keywords are present
const TRANSACTION_PRIORITY_KEYWORDS = [
  'số dư', 'so du', 'balance',
  'giao dịch thành công', 'giao dich thanh cong',
  'biến động số dư', 'bien dong so du',
  'chuyển khoản thành công', 'chuyen khoan thanh cong',
  'thanh toán thành công', 'thanh toan thanh cong',
  'đã nhận', 'da nhan', 'received',
  'đã chuyển', 'da chuyen', 'transferred',
  'gd:', 'stk:', 'tk:',
  'ma gd', 'mã gd',
];

// Merchant category mapping
const MERCHANT_CATEGORIES: Record<string, TransactionCategory> = {
  // Food & Dining
  'circle k': 'food',
  'GS25': 'food',
  'vinmart': 'food',
  'winmart': 'food',
  'baemin': 'food',
  'grabfood': 'food',
  'shopee food': 'food',
  'now': 'food',
  'go food': 'food',
  'coffee': 'food',
  'cafe': 'food',
  'restaurant': 'food',
  'nhà hàng': 'food',
  'quán': 'food',
  'ăn': 'food',
  'highlands': 'food',
  'starbucks': 'food',
  'the coffee house': 'food',
  'kfc': 'food',
  'lotteria': 'food',
  'jollibee': 'food',
  'mcdonalds': 'food',
  'burger king': 'food',
  'pizza': 'food',
  
  // Shopping
  'shopee': 'shopping',
  'lazada': 'shopping',
  'tiki': 'shopping',
  'sendo': 'shopping',
  'thế giới di động': 'shopping',
  'điện máy xanh': 'shopping',
  'fpt shop': 'shopping',
  'cellphones': 'shopping',
  'hoang ha': 'shopping',
  'uniqlo': 'shopping',
  'zara': 'shopping',
  'h&m': 'shopping',
  
  // Transport
  'grab': 'transport',
  'be': 'transport',
  'gojek': 'transport',
  'xanh sm': 'transport',
  'taxi': 'transport',
  'petrolimex': 'transport',
  'xăng': 'transport',
  'petroleum': 'transport',
  
  // Entertainment
  'cgv': 'entertainment',
  'lotte cinema': 'entertainment',
  'galaxy': 'entertainment',
  'bhd': 'entertainment',
  'game': 'entertainment',
  'garena': 'entertainment',
  'spotify': 'entertainment',
  'netflix': 'entertainment',
  
  // Bills
  'evn': 'bills',
  'điện lực': 'bills',
  'vnpt': 'bills',
  'viettel': 'bills',
  'mobifone': 'bills',
  'vinaphone': 'bills',
  'fpt telecom': 'bills',
  'nước': 'bills',
  
  // Health
  'vinmec': 'health',
  'bệnh viện': 'health',
  'hospital': 'health',
  'pharmacy': 'health',
  'nhà thuốc': 'health',
  'long chau': 'health',
  'pharmacity': 'health',
};

/**
 * Parse amount from notification text
 */
const parseAmount = (text: string): { amount: number; type: 'income' | 'expense' } | null => {
  // Remove thousand separators and normalize
  const normalizedText = text.toLowerCase();
  
  // Determine transaction type first
  let transactionType: 'income' | 'expense' = 'expense';
  
  if (INCOME_KEYWORDS.some(keyword => normalizedText.includes(keyword))) {
    transactionType = 'income';
  } else if (EXPENSE_KEYWORDS.some(keyword => normalizedText.includes(keyword))) {
    transactionType = 'expense';
  }
  
  // Check for explicit +/- signs
  if (normalizedText.includes('+') && !normalizedText.includes('-')) {
    transactionType = 'income';
  } else if (normalizedText.includes('-') && !normalizedText.includes('+')) {
    transactionType = 'expense';
  }
  
  // Extract amount
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      let amountStr = match[1] || match[2];
      
      // Handle sign prefix
      if (match[1] === '-') {
        transactionType = 'expense';
        amountStr = match[2];
      } else if (match[1] === '+') {
        transactionType = 'income';
        amountStr = match[2];
      }
      
      // Clean and parse amount
      const cleanAmount = amountStr
        .replace(/[,\.]/g, '')  // Remove separators
        .replace(/[^\d]/g, ''); // Keep only digits
      
      const amount = parseInt(cleanAmount, 10);
      
      if (!isNaN(amount) && amount > 0) {
        return { amount, type: transactionType };
      }
    }
  }
  
  return null;
};

/**
 * Extract merchant name from notification text
 */
const parseMerchant = (text: string): string | undefined => {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up merchant name
      let merchant = match[1].trim();
      
      // Remove common suffixes
      merchant = merchant
        .replace(/\s*lúc\s*\d.*/i, '')
        .replace(/\s*ngày\s*\d.*/i, '')
        .replace(/\s*vào\s*\d.*/i, '')
        .trim();
      
      if (merchant.length > 2 && merchant.length < 100) {
        return merchant;
      }
    }
  }
  
  return undefined;
};

/**
 * Auto-categorize based on merchant name
 */
const autoCategorizeMerchant = (merchant?: string): TransactionCategory => {
  if (!merchant) return 'other';
  
  const lowerMerchant = merchant.toLowerCase();
  
  for (const [keyword, category] of Object.entries(MERCHANT_CATEGORIES)) {
    if (lowerMerchant.includes(keyword)) {
      return category;
    }
  }
  
  return 'other';
};

/**
 * Extract time from notification text
 */
const parseTime = (text: string, notificationTime: number): Date => {
  for (const pattern of TIME_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // For now, use notification time as base
      // Could enhance to parse exact time from text
      break;
    }
  }
  
  return new Date(notificationTime);
};

/**
 * Detect bank from notification app package name
 */
const detectBank = (appPackage: string): BankCode | undefined => {
  const bank = getBankByPackage(appPackage);
  return bank?.code;
};

/**
 * Check if notification is an advertisement/promotional message
 */
export const isAdvertisementNotification = (notification: BankNotification): boolean => {
  const text = `${notification.title} ${notification.text}`.toLowerCase();
  
  // First check if it has priority transaction keywords
  // If it has transaction keywords, it's likely a real transaction even if it mentions promotions
  const hasTransactionKeywords = TRANSACTION_PRIORITY_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  if (hasTransactionKeywords) {
    return false; // Not an ad, it's a real transaction notification
  }
  
  // Count how many advertisement keywords are present
  const adKeywordCount = ADVERTISEMENT_KEYWORDS.filter(keyword => 
    text.includes(keyword.toLowerCase())
  ).length;
  
  // If 2 or more ad keywords found, it's likely an advertisement
  if (adKeywordCount >= 2) {
    console.log(`[CashTrack] Advertisement detected (${adKeywordCount} keywords):`, text.substring(0, 100));
    return true;
  }
  
  // Check for common promotional patterns
  const promotionalPatterns = [
    /ưu đãi.*%/i,
    /giảm.*%/i,
    /miễn phí.*khi/i,
    /tặng.*khi/i,
    /đăng ký.*để/i,
    /mở thẻ.*nhận/i,
    /hoàn tiền.*%/i,
    /0%.*lãi/i,
    /không.*phí.*giao dịch/i,
  ];
  
  if (promotionalPatterns.some(pattern => pattern.test(text))) {
    console.log('[CashTrack] Advertisement detected (pattern match):', text.substring(0, 100));
    return true;
  }
  
  return false;
};

/**
 * Check if notification is a banking/transaction notification
 */
export const isBankingNotification = (notification: BankNotification): boolean => {
  const text = `${notification.title} ${notification.text}`.toLowerCase();
  
  // First, filter out advertisements
  if (isAdvertisementNotification(notification)) {
    console.log('[CashTrack] Filtered out advertisement notification');
    return false;
  }
  
  // Check for amount pattern
  if (!AMOUNT_PATTERNS.some(pattern => pattern.test(notification.text))) {
    return false;
  }
  
  // Check for common banking keywords
  const bankingKeywords = [
    'vnd', 'vnđ', 'giao dịch', 'gd:', 'số dư', 'thanh toán',
    'chuyển khoản', 'nhận tiền', 'rút tiền', 'nạp tiền',
    'biến động số dư', 'transaction', 'balance',
    'stk', 'tk ', 'tài khoản', 'tai khoan', 'account'
  ];
  
  return bankingKeywords.some(keyword => text.includes(keyword));
};

/**
 * Parse bank notification into transaction data
 */
export const parseNotification = (notification: BankNotification): ParsedTransaction | null => {
  const fullText = `${notification.title} ${notification.text}`;
  
  // Parse amount and type
  const amountResult = parseAmount(fullText);
  if (!amountResult) {
    return null;
  }
  
  // Parse other fields
  const merchant = parseMerchant(fullText);
  const bankCode = detectBank(notification.app);
  const time = parseTime(fullText, notification.time);
  
  return {
    amount: amountResult.amount,
    type: amountResult.type,
    merchant,
    description: notification.text.substring(0, 200),
    bankCode,
    time,
    rawText: fullText,
  };
};

/**
 * Get category from parsed transaction
 */
export const getCategoryFromTransaction = (parsed: ParsedTransaction): TransactionCategory => {
  const text = parsed.rawText.toLowerCase();
  
  // Income transactions
  if (parsed.type === 'income') {
    // Check for salary keywords (with and without diacritics)
    if (text.includes('lương') || text.includes('luong') || text.includes('salary') || text.includes('tien luong')) {
      return 'salary';
    }
    // Check for gift keywords
    if (text.includes('quà') || text.includes('qua') || text.includes('gift') || text.includes('tang') || text.includes('tặng')) {
      return 'gift';
    }
    // Check for investment keywords
    if (text.includes('đầu tư') || text.includes('dau tu') || text.includes('investment') || 
        text.includes('lãi') || text.includes('lai suat') || text.includes('lai')) {
      return 'investment';
    }
    // Default: bank transfers (most common income type)
    return 'transfer';
  }
  
  // Expense - try to categorize by merchant first
  const merchantCategory = autoCategorizeMerchant(parsed.merchant);
  if (merchantCategory !== 'other') {
    return merchantCategory;
  }
  
  // Try to categorize by text content (with and without diacritics)
  // Food
  if (text.includes('ăn') || text.includes('an uong') || text.includes('food') || 
      text.includes('coffee') || text.includes('cafe') || text.includes('com') || 
      text.includes('cơm') || text.includes('bun') || text.includes('pho') ||
      text.includes('tra sua') || text.includes('trà sữa')) {
    return 'food';
  }
  // Transport
  if (text.includes('grab') || text.includes('taxi') || text.includes('xăng') || 
      text.includes('xang') || text.includes('be ') || text.includes('gojek') ||
      text.includes('di chuyen') || text.includes('di chuyển') || text.includes('petrol')) {
    return 'transport';
  }
  // Bills
  if (text.includes('điện') || text.includes('dien') || text.includes('nước') || 
      text.includes('nuoc') || text.includes('internet') || text.includes('bill') ||
      text.includes('evn') || text.includes('vnpt') || text.includes('viettel') ||
      text.includes('hoa don') || text.includes('hóa đơn')) {
    return 'bills';
  }
  // Shopping
  if (text.includes('shop') || text.includes('mua') || text.includes('lazada') || 
      text.includes('tiki') || text.includes('shopee') || text.includes('sendo') ||
      text.includes('the gioi di dong') || text.includes('dien may')) {
    return 'shopping';
  }
  // Entertainment
  if (text.includes('game') || text.includes('cgv') || text.includes('cinema') ||
      text.includes('phim') || text.includes('netflix') || text.includes('spotify') ||
      text.includes('giai tri') || text.includes('giải trí')) {
    return 'entertainment';
  }
  // Health
  if (text.includes('benh vien') || text.includes('bệnh viện') || text.includes('thuoc') ||
      text.includes('thuốc') || text.includes('pharmacy') || text.includes('hospital') ||
      text.includes('nha thuoc') || text.includes('nhà thuốc')) {
    return 'health';
  }
  // Education
  if (text.includes('hoc phi') || text.includes('học phí') || text.includes('school') ||
      text.includes('truong') || text.includes('trường') || text.includes('education') ||
      text.includes('sach') || text.includes('sách') || text.includes('course')) {
    return 'education';
  }
  
  return 'other';
};
