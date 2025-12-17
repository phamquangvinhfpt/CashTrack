// Transaction Store using Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, TransactionCategory, CATEGORIES } from '../types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from '../utils/dateUtils';

// Generate simple unique ID since uuid might not work in RN
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface TransactionFilters {
  type?: 'income' | 'expense' | 'all';
  category?: TransactionCategory;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  categoryBreakdown: Record<TransactionCategory, number>;
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  clearAllTransactions: () => void;
  importTransactions: (transactions: Transaction[]) => void;
  
  // Queries
  getTransactionById: (id: string) => Transaction | undefined;
  getFilteredTransactions: (filters: TransactionFilters) => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
  
  // Stats
  getStats: (startDate?: Date, endDate?: Date) => TransactionStats;
  getTodayStats: () => TransactionStats;
  getWeekStats: () => TransactionStats;
  getMonthStats: () => TransactionStats;
  
  // Daily breakdown
  getDailyTotals: (days: number) => Array<{ date: Date; income: number; expense: number }>;
  getCategoryTotals: (startDate?: Date, endDate?: Date) => Array<{ category: TransactionCategory; total: number; percentage: number }>;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      isLoading: false,
      error: null,
      
      addTransaction: (transactionData) => {
        const newTransaction: Transaction = {
          ...transactionData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set(state => ({
          transactions: [newTransaction, ...state.transactions],
        }));
        
        // Trigger webhook asynchronously (fire and forget)
        import('../services/webhookService').then(({ webhookService }) => {
          webhookService.onTransactionCreated(newTransaction).catch(console.error);
        });
        
        return newTransaction;
      },
      
      updateTransaction: (id, updates) => {
        let updatedTransaction: Transaction | undefined;
        
        set(state => {
          const transactions = state.transactions.map(t => {
            if (t.id === id) {
              updatedTransaction = { ...t, ...updates, updatedAt: new Date() };
              return updatedTransaction;
            }
            return t;
          });
          return { transactions };
        });
        
        // Trigger webhook asynchronously
        if (updatedTransaction) {
          import('../services/webhookService').then(({ webhookService }) => {
            webhookService.onTransactionUpdated(updatedTransaction!).catch(console.error);
          });
        }
      },
      
      deleteTransaction: (id) => {
        set(state => ({
          transactions: state.transactions.filter(t => t.id !== id),
        }));
        
        // Trigger webhook asynchronously
        import('../services/webhookService').then(({ webhookService }) => {
          webhookService.onTransactionDeleted(id).catch(console.error);
        });
      },

      importTransactions: (newTransactions) => {
        set(state => {
          const currentTransactions = [...state.transactions];
          let addedCount = 0;
          let updatedCount = 0;

          newTransactions.forEach(newTx => {
            const index = currentTransactions.findIndex(t => t.id === newTx.id);
            if (index !== -1) {
              // Update existing
              currentTransactions[index] = { ...currentTransactions[index], ...newTx, updatedAt: new Date() };
              updatedCount++;
            } else {
              // Add new
              currentTransactions.push({
                ...newTx,
                // Ensure required fields exist if missing from partial import
                createdAt: newTx.createdAt ? new Date(newTx.createdAt) : new Date(),
                updatedAt: new Date(),
                // If ID is missing, generate one (though import usually implies IDs exist)
                id: newTx.id || generateId()
              });
              addedCount++;
            }
          });

          // Sort by date (newest first)
          currentTransactions.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          return { transactions: currentTransactions };
        });
      },
      
      clearAllTransactions: () => {
        set({ transactions: [] });
      },

      
      getTransactionById: (id) => {
        return get().transactions.find(t => t.id === id);
      },
      
      getFilteredTransactions: (filters) => {
        let result = [...get().transactions];
        
        // Filter by type
        if (filters.type && filters.type !== 'all') {
          result = result.filter(t => t.type === filters.type);
        }
        
        // Filter by category
        if (filters.category) {
          result = result.filter(t => t.category === filters.category);
        }
        
        // Filter by date range
        if (filters.startDate) {
          result = result.filter(t => new Date(t.createdAt) >= filters.startDate!);
        }
        if (filters.endDate) {
          result = result.filter(t => new Date(t.createdAt) <= filters.endDate!);
        }
        
        // Filter by amount range
        if (filters.minAmount !== undefined) {
          result = result.filter(t => t.amount >= filters.minAmount!);
        }
        if (filters.maxAmount !== undefined) {
          result = result.filter(t => t.amount <= filters.maxAmount!);
        }
        
        // Filter by search query
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          result = result.filter(t =>
            t.description.toLowerCase().includes(query) ||
            t.merchant?.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query)
          );
        }
        
        // Sort by date (newest first)
        result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        return result;
      },
      
      getRecentTransactions: (limit = 10) => {
        return get()
          .transactions
          .sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, limit);
      },
      
      getStats: (startDate?, endDate?) => {
        let transactions = get().transactions;
        
        // Filter by date range if provided
        if (startDate) {
          transactions = transactions.filter(t => new Date(t.createdAt) >= startDate);
        }
        if (endDate) {
          transactions = transactions.filter(t => new Date(t.createdAt) <= endDate);
        }
        
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        // Category breakdown (only expenses)
        const categoryBreakdown = {} as Record<TransactionCategory, number>;
        CATEGORIES.forEach(cat => {
          categoryBreakdown[cat.id] = transactions
            .filter(t => t.type === 'expense' && t.category === cat.id)
            .reduce((sum, t) => sum + t.amount, 0);
        });
        
        return {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          transactionCount: transactions.length,
          categoryBreakdown,
        };
      },
      
      getTodayStats: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return get().getStats(today, tomorrow);
      },
      
      getWeekStats: () => {
        return get().getStats(startOfWeek(), endOfWeek());
      },
      
      getMonthStats: () => {
        return get().getStats(startOfMonth(), endOfMonth());
      },
      
      getDailyTotals: (days) => {
        const result: Array<{ date: Date; income: number; expense: number }> = [];
        const transactions = get().transactions;
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);
          
          const dayTransactions = transactions.filter(t => {
            const tDate = new Date(t.createdAt);
            return tDate >= date && tDate < nextDate;
          });
          
          result.push({
            date,
            income: dayTransactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0),
            expense: dayTransactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0),
          });
        }
        
        return result;
      },
      
      getCategoryTotals: (startDate?, endDate?) => {
        const stats = get().getStats(startDate, endDate);
        const total = stats.totalExpense;
        
        return CATEGORIES
          .map(cat => ({
            category: cat.id,
            total: stats.categoryBreakdown[cat.id],
            percentage: total > 0 ? (stats.categoryBreakdown[cat.id] / total) * 100 : 0,
          }))
          .filter(item => item.total > 0)
          .sort((a, b) => b.total - a.total);
      },
    }),
    {
      name: 'cashtrack-transactions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        transactions: state.transactions,
      }),
    }
  )
);
