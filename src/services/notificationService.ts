// Expo Notification Service
// For Expo, we'll use a different approach since react-native-android-notification-listener
// requires native code that's not available in Expo Go.
// You'll need to use EAS Build (Development Build) to use full notification listener.

import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { 
  BankNotification, 
  ParsedTransaction,
  BANKS 
} from '../types';
import { 
  isBankingNotification, 
  isAdvertisementNotification,
  parseNotification, 
  getCategoryFromTransaction 
} from '../utils/notificationParser';
import { useTransactionStore } from '../store/transactionStore';
import { useSettingsStore } from '../store/settingsStore';

export type NotificationPermissionStatus = 'authorized' | 'denied' | 'unknown';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Check if notification permission is granted
 */
export const checkNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      return 'authorized';
    } else if (status === 'denied') {
      return 'denied';
    }
    return 'unknown';
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return 'unknown';
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      return 'authorized';
    } else if (status === 'denied') {
      Alert.alert(
        'Quyền bị từ chối',
        'Để sử dụng tính năng đọc thông báo ngân hàng, vui lòng cấp quyền trong Cài đặt thiết bị.'
      );
      return 'denied';
    }
    return 'unknown';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'unknown';
  }
};

/**
 * Process incoming notification
 */
export const processNotification = async (notification: BankNotification): Promise<ParsedTransaction | null> => {
  console.log('[CashTrack] Received notification:', {
    app: notification.app,
    title: notification.title,
    text: notification.text?.substring(0, 100),
  });
  
  const settings = useSettingsStore.getState();
  const fullText = `${notification.title} ${notification.text}`;
  
  // If Gemini AI is configured, use it to detect notification type first
  if (settings.useAICategorizaton && settings.geminiApiKey) {
    console.log('[CashTrack] Using AI to detect notification type...');
    try {
      const { geminiService } = require('./geminiService');
      
      // Configure Gemini if not already
      if (!geminiService.isConfigured()) {
        geminiService.configure({ apiKey: settings.geminiApiKey });
      }
      
      const detection = await geminiService.detectNotificationType(fullText, notification.app);
      
      console.log('[CashTrack] AI detection result:', detection);
      
      // If AI is confident it's an advertisement, skip it
      if (detection.type === 'advertisement' && detection.confidence >= 0.7) {
        console.log(`[CashTrack] AI detected advertisement (${(detection.confidence * 100).toFixed(0)}% confidence): ${detection.reason}`);
        return null;
      }
      
      // If AI is confident it's a transaction, proceed
      if (detection.type === 'transaction' && detection.confidence >= 0.7) {
        console.log(`[CashTrack] AI confirmed transaction (${(detection.confidence * 100).toFixed(0)}% confidence): ${detection.reason}`);
        // Continue to parsing below
      }
      
      // If unknown or low confidence, fall back to rule-based detection
      if (detection.type === 'unknown' || detection.confidence < 0.7) {
        console.log('[CashTrack] AI uncertain, falling back to rule-based detection');
        // Fall through to rule-based check below
      }
    } catch (error) {
      console.error('[CashTrack] AI detection failed, using rule-based fallback:', error);
      // Continue with rule-based detection
    }
  }
  
  // Rule-based check: Check if it's a banking notification (also filters out advertisements)
  if (!isBankingNotification(notification)) {
    // Check specifically if it was filtered as an advertisement
    if (isAdvertisementNotification(notification)) {
      console.log('[CashTrack] Filtered advertisement/promotional notification, skipping');
    } else {
      console.log('[CashTrack] Not a banking notification, skipping');
    }
    return null;
  }
  
  // Check if this app is in selected bank apps
  if (settings.selectedBankApps.length > 0 && !settings.selectedBankApps.includes(notification.app)) {
    console.log('[CashTrack] App not in selected banks, skipping');
    return null;
  }
  
  // Parse the notification
  const parsed = parseNotification(notification);
  if (!parsed) {
    console.log('[CashTrack] Failed to parse notification');
    return null;
  }
  
  console.log('[CashTrack] Parsed transaction:', parsed);
  
  // Get category
  let category = getCategoryFromTransaction(parsed);
  
  // Try AI categorization if enabled and rule-based result is 'other' or to refine metadata
  if (settings.useAICategorizaton && settings.geminiApiKey) {
    console.log('[CashTrack] AI Categorization enabled, calling Gemini...');
    try {
      // Import geminiService dynamically to avoid circular dependencies if any
      const { geminiService } = require('./geminiService');
      
      const analysis = await geminiService.analyzeTransaction(
        parsed.rawText, 
        parsed.amount, 
        parsed.type
      );
      
      console.log('[CashTrack] Gemini analysis result:', analysis);
      
      if (analysis.suggestedCategory && analysis.suggestedCategory !== 'other') {
        category = analysis.suggestedCategory;
      }
      
      // Enhance merchant info if AI found it and parser couldn't
      if (analysis.merchant && !parsed.merchant) {
        parsed.merchant = analysis.merchant;
      }
      
      // Enhance description if AI generated a better one
      if (analysis.description && analysis.description.length > parsed.description!.length) { // fixed: description is optional on parsed
        parsed.description = analysis.description;
      }
      
    } catch (error) {
       console.error('[CashTrack] AI analysis failed:', error);
       // Fallback to rule-based category, no action needed
    }
  }
  
  // Add to store
  const store = useTransactionStore.getState();
  
  // Check for duplicates in store to prevent re-importing the same notification
  // even if the app was restarted or cache cleared
  const isDuplicate = store.transactions.some(t => 
    t.source === 'notification' && 
    t.rawNotification === parsed.rawText
  );
  
  if (isDuplicate) {
    console.log('[CashTrack] Duplicate transaction found in store, skipping:', parsed.description);
    return parsed; // Return parsed to indicate it was "handled" (as a duplicate)
  }

  const newTransaction = store.addTransaction({
    amount: parsed.amount,
    type: parsed.type,
    category,
    description: parsed.description || '',
    merchant: parsed.merchant,
    bankAccount: parsed.bankCode,
    source: 'notification',
    rawNotification: parsed.rawText,
  });
  
  console.log('[CashTrack] Transaction added successfully');
  
  return parsed;
};

/**
 * Register for push notifications
 */
export const registerForPushNotifications = async () => {
  const status = await requestNotificationPermission();
  
  if (status !== 'authorized') {
    return null;
  }

  // Get push token (for future cloud sync features)
  // const token = await Notifications.getExpoPushTokenAsync();
  // return token.data;
  
  return true;
};

/**
 * Get list of supported banking apps
 */
export const getSupportedBanks = () => {
  return BANKS.map(bank => ({
    ...bank,
    isInstalled: false, // Can't check in Expo Go
  }));
};

/**
 * Register notification handler - placeholder for Expo
 * Full notification listener requires EAS Development Build
 */
export const registerNotificationHandler = () => {
  console.log('[CashTrack] Notification handler registered (limited in Expo Go)');
  console.log('[CashTrack] For full NotificationListener support, use EAS Development Build');
};

/**
 * Test notification parsing with sample data
 */
export const testNotificationParsing = (sampleText: string): ParsedTransaction | null => {
  const testNotification: BankNotification = {
    app: 'com.mbmobile',
    title: 'MB Bank',
    text: sampleText,
    time: Date.now(),
  };
  
  return parseNotification(testNotification);
};

// Sample notifications for testing
export const SAMPLE_NOTIFICATIONS = {
  mbBankExpense: {
    app: 'com.mbmobile',
    title: 'MB Bank',
    text: 'GD: -50,000 VND tai Circle K luc 14:30 23/12. SD: 5,000,000 VND. Chi tiet: mua hang.',
    time: Date.now(),
  },
  vcbIncome: {
    app: 'com.VCB',
    title: 'Vietcombank',
    text: 'So TK *1234 nhan +2,500,000 VND tu NGUYEN VAN A. ND: Chuyen tien. SD: 10,500,000 VND.',
    time: Date.now(),
  },
  momoPayment: {
    app: 'com.mservice.momotransfer',
    title: 'MoMo',
    text: 'Ban vua thanh toan 120,000 VND cho Grab tai Quan 1, HCM. So du vi: 500,000 VND.',
    time: Date.now(),
  },
};
