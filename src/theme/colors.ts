// CashTrack Color Palette
// Professional color scheme with Dark/Light mode support

export const colors = {
  // Primary colors - Emerald/Teal gradient for financial apps
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main primary
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Secondary colors - Deep Purple/Indigo for accents
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6', // Main secondary
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },

  // Accent colors - Coral/Orange for highlights
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main accent
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },

  // Semantic colors
  success: {
    light: '#34d399',
    main: '#10b981',
    dark: '#059669',
  },
  warning: {
    light: '#fbbf24',
    main: '#f59e0b',
    dark: '#d97706',
  },
  error: {
    light: '#f87171',
    main: '#ef4444',
    dark: '#dc2626',
  },
  info: {
    light: '#60a5fa',
    main: '#3b82f6',
    dark: '#2563eb',
  },

  // Income (Green) and Expense (Red) specific
  income: {
    light: '#4ade80',
    main: '#22c55e',
    dark: '#16a34a',
    bg: '#dcfce7',
  },
  expense: {
    light: '#fb7185',
    main: '#f43f5e',
    dark: '#e11d48',
    bg: '#ffe4e6',
  },

  // Neutral/Gray scale
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
};

// Light Theme
export const lightTheme = {
  mode: 'light' as const,
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    card: '#ffffff',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Surface colors (for cards, modals, etc.)
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    disabled: '#e2e8f0',
  },

  // Text colors
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    disabled: '#cbd5e1',
    inverse: '#ffffff',
    link: colors.primary[600],
  },

  // Border colors
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    focus: colors.primary[500],
    error: colors.error.main,
  },

  // Status bar
  statusBar: 'dark-content' as const,

  // Shadows
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 5,
    },
  },

  // Gradients - using const assertion for expo-linear-gradient
  gradients: {
    primary: ['#10b981', '#059669'] as const,
    secondary: ['#8b5cf6', '#6d28d9'] as const,
    accent: ['#f97316', '#ea580c'] as const,
    card: ['#ffffff', '#f8fafc'] as const,
    income: ['#22c55e', '#16a34a'] as const,
    expense: ['#f43f5e', '#e11d48'] as const,
    hero: ['#0f172a', '#1e293b'] as const,
  },

  // Colors reference
  colors,
};

// Dark Theme
export const darkTheme = {
  mode: 'dark' as const,
  
  // Background colors
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    card: '#1e293b',
    elevated: '#334155',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Surface colors
  surface: {
    primary: '#1e293b',
    secondary: '#334155',
    tertiary: '#475569',
    disabled: '#334155',
  },

  // Text colors
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    disabled: '#64748b',
    inverse: '#0f172a',
    link: colors.primary[400],
  },

  // Border colors
  border: {
    primary: '#334155',
    secondary: '#475569',
    focus: colors.primary[400],
    error: colors.error.light,
  },

  // Status bar
  statusBar: 'light-content' as const,

  // Shadows (less visible in dark mode)
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 5,
    },
  },

  // Gradients - using const assertion for expo-linear-gradient
  gradients: {
    primary: ['#059669', '#047857'] as const,
    secondary: ['#7c3aed', '#5b21b6'] as const,
    accent: ['#ea580c', '#c2410c'] as const,
    card: ['#1e293b', '#334155'] as const,
    income: ['#16a34a', '#15803d'] as const,
    expense: ['#e11d48', '#be123c'] as const,
    hero: ['#1e293b', '#334155'] as const,
  },

  // Colors reference
  colors,
};

export type Theme = typeof lightTheme;
