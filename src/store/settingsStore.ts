// Settings Store using Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Budget {
  category: string;
  limit: number;
  period: 'daily' | 'weekly' | 'monthly';
}

interface SettingsState {
  // App settings
  language: 'vi' | 'en';
  currency: string;
  
  // Notification settings
  notificationEnabled: boolean;
  notificationPermission: 'authorized' | 'denied' | 'unknown';
  selectedBankApps: string[]; // Package names of selected banking apps
  
  // Budget settings
  monthlyBudget: number;
  categoryBudgets: Budget[];
  budgetAlertThreshold: number; // Percentage (e.g., 80 means alert at 80%)
  
  // Display settings
  showCents: boolean;
  compactNumbers: boolean;
  
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
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default values
      language: 'vi',
      currency: 'VND',
      notificationEnabled: false,
      notificationPermission: 'unknown',
      selectedBankApps: [],
      monthlyBudget: 10000000, // 10 million VND
      categoryBudgets: [],
      budgetAlertThreshold: 80,
      showCents: false,
      compactNumbers: true,
      
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
      
      setMonthlyBudget: (amount) => set({ monthlyBudget: amount }),
      
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
    }),
    {
      name: 'cashtrack-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
