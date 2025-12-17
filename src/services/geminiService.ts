// Gemini AI Service for transaction analysis and smart categorization
// Adapted for Expo

import { TransactionCategory, CATEGORIES, Transaction } from '../types';

// Gemini API Configuration
export interface GeminiConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

// Transaction Analysis Result
export interface TransactionAnalysis {
  suggestedCategory: TransactionCategory;
  confidence: number; // 0-1
  merchant?: string;
  description?: string;
  insights?: string[];
  tags?: string[];
}

// Monthly Report from Gemini
export interface AIMonthlyReport {
  summary: string;
  insights: string[];
  recommendations: string[];
  topSpendingCategories: Array<{
    category: TransactionCategory;
    amount: number;
    percentageChange: number;
    advice: string;
  }>;
  savingTips: string[];
  budgetStatus: 'healthy' | 'warning' | 'critical';
  predictedNextMonthExpense?: number;
}

// Income Analysis
export interface IncomeAnalysis {
  totalIncome: number;
  sources: Array<{
    source: string;
    amount: number;
    frequency: 'one-time' | 'monthly' | 'irregular';
  }>;
  trend: 'increasing' | 'stable' | 'decreasing';
  insights: string[];
}

// Gemini API Response Types
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

class GeminiService {
  private apiKey: string | null = null;
  private model: string = 'gemini-flash-latest';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  configure(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    if (config.model) {
      this.model = config.model;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    
    console.log('[Gemini] Calling API with model:', this.model);
    
    try {
      const requestBody = {
        contents: [{
          role: 'user',
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Gemini] API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      console.log('[Gemini] Response received:', data.candidates?.length, 'candidates');
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('No response from Gemini');
    } catch (error) {
      console.error('[Gemini] API call failed:', error);
      throw error;
    }
  }


  private parseJsonResponse<T>(response: string): T {
    let cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleanResponse);
  }

  async analyzeTransaction(
    rawText: string, 
    amount: number, 
    transactionType: 'income' | 'expense'
  ): Promise<TransactionAnalysis> {
    const categoryList = CATEGORIES
      .filter(c => transactionType === 'expense' 
        ? !['salary', 'investment', 'gift'].includes(c.id) || c.id === 'other'
        : ['salary', 'transfer', 'investment', 'gift', 'other'].includes(c.id))
      .map(c => `"${c.id}": ${c.labelVi}`)
      .join(', ');

    const prompt = `
Bạn là một AI phân tích giao dịch tài chính. Phân tích nội dung chuyển khoản sau và trả về JSON:

Nội dung giao dịch: "${rawText}"
Số tiền: ${amount.toLocaleString('vi-VN')} VND
Loại giao dịch: ${transactionType === 'income' ? 'Thu nhập' : 'Chi tiêu'}

Danh sách categories: {${categoryList}}

Trả về CHÍNH XÁC định dạng JSON sau (không có markdown, không có text khác):
{
  "suggestedCategory": "<category_id>",
  "confidence": <0.0-1.0>,
  "merchant": "<tên merchant/nguồn tiền nếu tìm thấy>",
  "description": "<mô tả ngắn gọn về giao dịch>",
  "insights": ["<insight 1>", "<insight 2>"],
  "tags": ["tag1", "tag2"]
}
`;

    try {
      const response = await this.callGemini(prompt);
      const result = this.parseJsonResponse<TransactionAnalysis>(response);
      
      const validCategory = CATEGORIES.find(c => c.id === result.suggestedCategory);
      if (!validCategory) {
        result.suggestedCategory = 'other';
        result.confidence = 0.5;
      }
      
      return result;
    } catch (error) {
      console.error('Transaction analysis failed:', error);
      return {
        suggestedCategory: 'other',
        confidence: 0,
        description: rawText.substring(0, 100),
      };
    }
  }

  async generateMonthlyReport(
    transactions: Transaction[],
    monthlyBudget: number,
    previousMonthStats?: {
      totalExpense: number;
      totalIncome: number;
      categoryBreakdown: Record<TransactionCategory, number>;
    }
  ): Promise<AIMonthlyReport> {
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');
    
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    
    const categoryBreakdown: Record<string, number> = {};
    expenses.forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    const categoryData = CATEGORIES
      .filter(c => categoryBreakdown[c.id] > 0)
      .map(c => ({
        id: c.id,
        name: c.labelVi,
        amount: categoryBreakdown[c.id],
        percentage: ((categoryBreakdown[c.id] / totalExpense) * 100).toFixed(1),
      }))
      .sort((a, b) => b.amount - a.amount);

    const budgetUsedPercent = monthlyBudget > 0 
      ? ((totalExpense / monthlyBudget) * 100).toFixed(1) 
      : '0';

    const prompt = `
Bạn là chuyên gia tài chính cá nhân. Phân tích dữ liệu chi tiêu tháng này:

TỔNG QUAN:
- Tổng thu nhập: ${totalIncome.toLocaleString('vi-VN')} VND
- Tổng chi tiêu: ${totalExpense.toLocaleString('vi-VN')} VND
- Cân đối: ${(totalIncome - totalExpense).toLocaleString('vi-VN')} VND
- Ngân sách: ${monthlyBudget.toLocaleString('vi-VN')} VND
- Đã dùng: ${budgetUsedPercent}%

CHI TIÊU THEO DANH MỤC:
${categoryData.map(c => `- ${c.name}: ${c.amount.toLocaleString('vi-VN')} VND (${c.percentage}%)`).join('\n')}

Trả về CHÍNH XÁC định dạng JSON (không markdown):
{
  "summary": "<tóm tắt 2-3 câu về tình hình tài chính>",
  "insights": ["<nhận xét 1>", "<nhận xét 2>", "<nhận xét 3>"],
  "recommendations": ["<khuyến nghị 1>", "<khuyến nghị 2>"],
  "topSpendingCategories": [
    {
      "category": "<category_id>",
      "amount": <số tiền>,
      "percentageChange": 0,
      "advice": "<lời khuyên cho category này>"
    }
  ],
  "savingTips": ["<mẹo tiết kiệm 1>", "<mẹo 2>"],
  "budgetStatus": "<healthy|warning|critical>",
  "predictedNextMonthExpense": <dự đoán chi tiêu tháng sau>
}
`;

    try {
      const response = await this.callGemini(prompt);
      return this.parseJsonResponse<AIMonthlyReport>(response);
    } catch (error) {
      console.error('Monthly report generation failed:', error);
      return {
        summary: 'Không thể tạo báo cáo tự động. Vui lòng kiểm tra cấu hình API.',
        insights: [],
        recommendations: [],
        topSpendingCategories: [],
        savingTips: [],
        budgetStatus: totalExpense / monthlyBudget > 0.9 ? 'critical' : 
                      totalExpense / monthlyBudget > 0.7 ? 'warning' : 'healthy',
      };
    }
  }

  async analyzeIncome(incomeTransactions: Transaction[]): Promise<IncomeAnalysis> {
    if (incomeTransactions.length === 0) {
      return {
        totalIncome: 0,
        sources: [],
        trend: 'stable',
        insights: ['Chưa có dữ liệu thu nhập để phân tích'],
      };
    }

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const sourceMap: Record<string, { amount: number; count: number }> = {};
    incomeTransactions.forEach(t => {
      const key = t.merchant || t.description || 'Khác';
      if (!sourceMap[key]) {
        sourceMap[key] = { amount: 0, count: 0 };
      }
      sourceMap[key].amount += t.amount;
      sourceMap[key].count++;
    });

    return {
      totalIncome,
      sources: Object.entries(sourceMap).map(([source, data]) => ({
        source,
        amount: data.amount,
        frequency: data.count > 1 ? 'irregular' : 'one-time' as const,
      })),
      trend: 'stable',
      insights: [`Tổng ${incomeTransactions.length} khoản thu nhập từ ${Object.keys(sourceMap).length} nguồn`],
    };
  }

  /**
   * Detect if a notification is a real transaction or advertisement
   * Returns the type and confidence level
   */
  async detectNotificationType(
    notificationText: string,
    appPackage: string
  ): Promise<{
    type: 'transaction' | 'advertisement' | 'unknown';
    confidence: number;
    reason: string;
    extractedAmount?: number;
    transactionType?: 'income' | 'expense';
  }> {
    const prompt = `
Bạn là AI phân tích thông báo ngân hàng Việt Nam. Xác định xem thông báo sau là GIAO DỊCH THỰC hay QUẢNG CÁO.

Thông báo từ app: ${appPackage}
Nội dung: "${notificationText}"

HƯỚNG DẪN PHÂN LOẠI:
- GIAO DỊCH THỰC: Có số tiền cụ thể, số dư tài khoản, mã giao dịch, thông báo chuyển/nhận tiền thành công
- QUẢNG CÁO: Khuyến mãi, ưu đãi, giảm giá, mở thẻ, đăng ký dịch vụ, giới thiệu sản phẩm, chương trình marketing

Trả về CHÍNH XÁC JSON (không markdown):
{
  "type": "<transaction|advertisement|unknown>",
  "confidence": <0.0-1.0>,
  "reason": "<giải thích ngắn gọn>",
  "extractedAmount": <số tiền nếu là giao dịch, null nếu không có>,
  "transactionType": "<income|expense nếu là giao dịch, null nếu không phải>"
}
`;

    try {
      const response = await this.callGemini(prompt);
      const result = this.parseJsonResponse<{
        type: 'transaction' | 'advertisement' | 'unknown';
        confidence: number;
        reason: string;
        extractedAmount?: number;
        transactionType?: 'income' | 'expense';
      }>(response);
      
      console.log('[Gemini] Notification type detection:', result);
      return result;
    } catch (error) {
      console.error('[Gemini] Notification type detection failed:', error);
      return {
        type: 'unknown',
        confidence: 0,
        reason: 'AI detection failed',
      };
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;
