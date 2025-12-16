// Settings Store using Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geminiService } from '../services/geminiService';

interface Budget {
  category: string;
  limit: number;
  period: 'daily' | 'weekly' | 'monthly';
}

// Filter period type for stats and reports
export type FilterPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

interface DateFilter {
  period: FilterPeriod;
  startDate?: Date;
  endDate?: Date;
  selectedMonth?: number; // 0-11
  selectedYear?: number;
}

interface SettingsState {
  // App settings
  language: 'vi' | 'en';
  currency: string;
  
  // Notification settings
  notificationEnabled: boolean;
  notificationPermission: 'authorized' | 'denied' | 'unknown';
  selectedBankApps: string[];
  
  // Budget settings
  monthlyBudget: number;
  isCustomBudget: boolean;
  categoryBudgets: Budget[];
  budgetAlertThreshold: number;
  
  // Display settings
  showCents: boolean;
  compactNumbers: boolean;
  
  // AI/Gemini settings
  geminiApiKey: string;
  useAICategorizaton: boolean;
  useAIReports: boolean;
  
  // Webhook settings
  webhooksEnabled: boolean;
  
  // Filter settings
  currentFilter: DateFilter;
  
  // Actions
  setLanguage: (lang: 'vi' | 'en') => void;
  setCurrency: (currency: string) => void;
  setNotificationEnabled: (enabled: boolean) => void;
  setNotificationPermission: (permission: 'authorized' | 'denied' | 'unknown') => void;
  addBankApp: (packageName: string) => void;
  removeBankApp: (packageName: string) => void;
  setMonthlyBudget: (amount: number) => void;
  setCategoryBudget: (budget: Budget) => void;
  removeCategoryBudget: (category: string) => void;
  setBudgetAlertThreshold: (threshold: number) => void;
  setShowCents: (show: boolean) => void;
  setCompactNumbers: (compact: boolean) => void;
  
  // AI settings actions
  setGeminiApiKey: (key: string) => void;
  setUseAICategorization: (enabled: boolean) => void;
  setUseAIReports: (enabled: boolean) => void;
  
  // Webhook settings actions
  setWebhooksEnabled: (enabled: boolean) => void;
  
  // Filter actions
  setFilter: (filter: DateFilter) => void;
  setFilterMonth: (month: number, year: number) => void;
  setFilterYear: (year: number) => void;
  resetFilter: () => void;
}

const getDefaultFilter = (): DateFilter => ({
  period: 'month',
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
});

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default values
      language: 'vi',
      currency: 'VND',
      notificationEnabled: false,
      notificationPermission: 'unknown',
      selectedBankApps: [],
      monthlyBudget: 10000000,
      isCustomBudget: false,
      categoryBudgets: [],
      budgetAlertThreshold: 80,
      showCents: false,
      compactNumbers: true,
      
      // AI settings defaults
      geminiApiKey: '',
      useAICategorizaton: false,
      useAIReports: false,
      
      // Webhook defaults
      webhooksEnabled: false,
      
      // Filter defaults
      currentFilter: getDefaultFilter(),
      
      // Actions
      setLanguage: (lang) => set({ language: lang }),
      setCurrency: (currency) => set({ currency }),
      setNotificationEnabled: (enabled) => set({ notificationEnabled: enabled }),
      setNotificationPermission: (permission) => set({ notificationPermission: permission }),
      
      addBankApp: (packageName) => set(state => ({
        selectedBankApps: state.selectedBankApps.includes(packageName)
          ? state.selectedBankApps
          : [...state.selectedBankApps, packageName],
      })),
      
      removeBankApp: (packageName) => set(state => ({
        selectedBankApps: state.selectedBankApps.filter(p => p !== packageName),
      })),
      
      setMonthlyBudget: (amount) => set({ 
        monthlyBudget: amount,
        isCustomBudget: true,
      }),
      
      setCategoryBudget: (budget) => set(state => {
        const existing = state.categoryBudgets.findIndex(b => b.category === budget.category);
        if (existing >= 0) {
          const updated = [...state.categoryBudgets];
          updated[existing] = budget;
          return { categoryBudgets: updated };
        }
        return { categoryBudgets: [...state.categoryBudgets, budget] };
      }),
      
      removeCategoryBudget: (category) => set(state => ({
        categoryBudgets: state.categoryBudgets.filter(b => b.category !== category),
      })),
      
      setBudgetAlertThreshold: (threshold) => set({ budgetAlertThreshold: threshold }),
      setShowCents: (show) => set({ showCents: show }),
      setCompactNumbers: (compact) => set({ compactNumbers: compact }),
      
      // AI settings actions
      setGeminiApiKey: (key) => {
        if (key) {
          geminiService.configure({ apiKey: key });
        }
        set({ geminiApiKey: key });
      },
      
      setUseAICategorization: (enabled) => set({ useAICategorizaton: enabled }),
      setUseAIReports: (enabled) => set({ useAIReports: enabled }),
      
      // Webhook settings actions
      setWebhooksEnabled: (enabled) => set({ webhooksEnabled: enabled }),
      
      // Filter actions
      setFilter: (filter) => set({ currentFilter: filter }),
      
      setFilterMonth: (month, year) => set({
        currentFilter: {
          period: 'month',
          selectedMonth: month,
          selectedYear: year,
        },
      }),
      
      setFilterYear: (year) => set({
        currentFilter: {
          period: 'year',
          selectedYear: year,
        },
      }),
      
      resetFilter: () => set({ currentFilter: getDefaultFilter() }),
    }),
    {
      name: 'cashtrack-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.geminiApiKey) {
          geminiService.configure({ apiKey: state.geminiApiKey });
        }
      },
    }
  )
);
