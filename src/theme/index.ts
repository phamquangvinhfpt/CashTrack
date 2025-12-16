// Theme index - exports all theme utilities
export * from './colors';
export * from './typography';
export * from './spacing';

import { lightTheme, darkTheme, Theme } from './colors';

export { lightTheme, darkTheme };
export type { Theme };

// Theme helper functions
export const getTheme = (mode: 'light' | 'dark'): Theme => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
