// Spacing system for CashTrack
// Based on 4px grid for consistent spacing

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Common layout dimensions
export const layout = {
  // Screen padding
  screenPaddingHorizontal: spacing[4],
  screenPaddingVertical: spacing[6],
  
  // Card
  cardPadding: spacing[4],
  cardBorderRadius: borderRadius.xl,
  cardGap: spacing[3],
  
  // List items
  listItemPadding: spacing[4],
  listItemGap: spacing[3],
  listItemBorderRadius: borderRadius.lg,
  
  // Input fields
  inputHeight: 48,
  inputPaddingHorizontal: spacing[4],
  inputBorderRadius: borderRadius.lg,
  
  // Buttons
  buttonHeightSmall: 36,
  buttonHeightMedium: 44,
  buttonHeightLarge: 52,
  buttonBorderRadius: borderRadius.lg,
  
  // Icons
  iconSizeSmall: 16,
  iconSizeMedium: 24,
  iconSizeLarge: 32,
  iconSizeXL: 48,
  
  // Avatar
  avatarSizeSmall: 32,
  avatarSizeMedium: 48,
  avatarSizeLarge: 64,
  avatarSizeXL: 96,
  
  // Bottom tab bar
  tabBarHeight: 64,
  tabBarIconSize: 24,
  
  // Header
  headerHeight: 56,
  
  // Safe area
  bottomSafeArea: 34,
  topSafeArea: 44,
};

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};
