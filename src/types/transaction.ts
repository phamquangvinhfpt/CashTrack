// Transaction and expense related types
import { MaterialIcons } from '@expo/vector-icons';

export type MaterialIconName = keyof typeof MaterialIcons.glyphMap;
export type GradientTuple = readonly [string, string];

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: TransactionCategory;
  description: string;
  merchant?: string;
  bankAccount?: string;
  source: 'notification' | 'manual' | 'api';
  rawNotification?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionCategory = 
  | 'food'
  | 'shopping'
  | 'transport'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'education'
  | 'salary'
  | 'transfer'
  | 'investment'
  | 'gift'
  | 'other';

export interface CategoryInfo {
  id: TransactionCategory;
  label: string;
  labelVi: string;
  icon: MaterialIconName;
  color: string;
  gradient: GradientTuple;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'food',
    label: 'Food & Dining',
    labelVi: 'Ăn uống',
    icon: 'restaurant',
    color: '#f97316',
    gradient: ['#fb923c', '#ea580c'] as const,
  },
  {
    id: 'shopping',
    label: 'Shopping',
    labelVi: 'Mua sắm',
    icon: 'shopping-bag',
    color: '#ec4899',
    gradient: ['#f472b6', '#db2777'] as const,
  },
  {
    id: 'transport',
    label: 'Transportation',
    labelVi: 'Di chuyển',
    icon: 'directions-car',
    color: '#3b82f6',
    gradient: ['#60a5fa', '#2563eb'] as const,
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    labelVi: 'Giải trí',
    icon: 'movie',
    color: '#a855f7',
    gradient: ['#c084fc', '#9333ea'] as const,
  },
  {
    id: 'bills',
    label: 'Bills & Utilities',
    labelVi: 'Hóa đơn',
    icon: 'receipt',
    color: '#ef4444',
    gradient: ['#f87171', '#dc2626'] as const,
  },
  {
    id: 'health',
    label: 'Health & Medical',
    labelVi: 'Sức khỏe',
    icon: 'local-hospital',
    color: '#14b8a6',
    gradient: ['#2dd4bf', '#0d9488'] as const,
  },
  {
    id: 'education',
    label: 'Education',
    labelVi: 'Giáo dục',
    icon: 'school',
    color: '#6366f1',
    gradient: ['#818cf8', '#4f46e5'] as const,
  },
  {
    id: 'salary',
    label: 'Salary',
    labelVi: 'Lương',
    icon: 'account-balance-wallet',
    color: '#22c55e',
    gradient: ['#4ade80', '#16a34a'] as const,
  },
  {
    id: 'transfer',
    label: 'Transfer',
    labelVi: 'Chuyển khoản',
    icon: 'swap-horiz',
    color: '#06b6d4',
    gradient: ['#22d3ee', '#0891b2'] as const,
  },
  {
    id: 'investment',
    label: 'Investment',
    labelVi: 'Đầu tư',
    icon: 'trending-up',
    color: '#10b981',
    gradient: ['#34d399', '#059669'] as const,
  },
  {
    id: 'gift',
    label: 'Gift',
    labelVi: 'Quà tặng',
    icon: 'card-giftcard',
    color: '#f43f5e',
    gradient: ['#fb7185', '#e11d48'] as const,
  },
  {
    id: 'other',
    label: 'Other',
    labelVi: 'Khác',
    icon: 'more-horiz',
    color: '#64748b',
    gradient: ['#94a3b8', '#475569'] as const,
  },
];

export const getCategoryById = (id: TransactionCategory): CategoryInfo => {
  return CATEGORIES.find(cat => cat.id === id) || CATEGORIES[CATEGORIES.length - 1];
};
