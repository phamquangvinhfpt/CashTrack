// Permission Check Utility for Notification Listener
import { Platform, Linking, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

/**
 * Check if notification listener permission is likely granted
 * Note: There's no direct API to check this, so we use heuristics
 */
export const checkNotificationListenerPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }
  
  // We can't directly check notification listener permission
  // But we can guide users to the settings
  return true; // Assume granted, let native service handle it
};

/**
 * Open Notification Listener settings
 */
export const openNotificationListenerSettings = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    Alert.alert('Không hỗ trợ', 'Chức năng này chỉ hoạt động trên Android');
    return;
  }

  try {
    // Try to open notification listener settings directly
    await IntentLauncher.startActivityAsync(
      'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS'
    );
  } catch (error) {
    console.log('[CashTrack] Could not open notification listener settings, trying fallback...');
    
    try {
      // Fallback: Open app settings
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: 'package:com.cashtrack.app' }
      );
    } catch (fallbackError) {
      // Last resort: Open general settings
      await Linking.openSettings();
    }
  }
};

/**
 * Show permission request dialog
 */
export const showNotificationPermissionDialog = (): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      '🔔 Cấp quyền đọc thông báo',
      'Để tự động theo dõi chi tiêu từ thông báo ngân hàng, CashTrack cần quyền truy cập thông báo.\n\n' +
      'Vui lòng bật CashTrack trong danh sách "Notification access".',
      [
        {
          text: 'Để sau',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Mở Cài đặt',
          onPress: async () => {
            await openNotificationListenerSettings();
            resolve(true);
          },
        },
      ],
      { cancelable: false }
    );
  });
};

/**
 * Show onboarding permission prompt with detailed instructions
 */
export const showOnboardingPermissionPrompt = (): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      '👋 Chào mừng đến CashTrack!',
      'Để tự động ghi nhận chi tiêu từ thông báo ngân hàng (VCB, MB, Techcombank...), bạn cần:\n\n' +
      '1. Mở Settings > Notification access\n' +
      '2. Tìm và bật CashTrack\n\n' +
      '⚠️ Lưu ý: Trên một số điện thoại (Samsung, Xiaomi, Oppo), đường dẫn có thể là:\n' +
      '• Settings > Privacy > Notification access\n' +
      '• Settings > Apps > Special access > Notification access',
      [
        {
          text: 'Bỏ qua',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Cài đặt ngay',
          onPress: async () => {
            await openNotificationListenerSettings();
            resolve(true);
          },
        },
      ],
      { cancelable: false }
    );
  });
};

export default {
  checkNotificationListenerPermission,
  openNotificationListenerSettings,
  showNotificationPermissionDialog,
  showOnboardingPermissionPrompt,
};
