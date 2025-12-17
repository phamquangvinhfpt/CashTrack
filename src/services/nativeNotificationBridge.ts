// Native Notification Bridge Service
// This service reads notifications saved by the native NotificationListener

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import { 
  BankNotification, 
  ParsedTransaction,
} from '../types';
import { 
  isBankingNotification, 
  parseNotification, 
  getCategoryFromTransaction 
} from '../utils/notificationParser';
import { useTransactionStore } from '../store/transactionStore';
import { useSettingsStore } from '../store/settingsStore';

const CHECK_INTERVAL = 5000; // Check every 5 seconds

let intervalId: NodeJS.Timeout | null = null;

/**
 * Start listening for notifications from native service
 */
export const startNotificationListener = () => {
  if (Platform.OS !== 'android') {
    console.log('[CashTrack] Notification listener only works on Android');
    return;
  }

  console.log('[CashTrack] Starting notification listener...');
  
  // Clear any existing interval
  if (intervalId) {
    clearInterval(intervalId);
  }

  // Check for new notifications periodically
  intervalId = setInterval(async () => {
    // Check if notification reading is enabled in settings
    const notificationEnabled = useSettingsStore.getState().notificationEnabled;
    if (!notificationEnabled) {
      return; // Skip if disabled
    }
    await checkForNewNotifications();
  }, CHECK_INTERVAL);

  // Also check immediately (if enabled)
  const notificationEnabled = useSettingsStore.getState().notificationEnabled;
  if (notificationEnabled) {
    checkForNewNotifications();
  }
};

/**
 * Stop listening for notifications
 */
export const stopNotificationListener = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  console.log('[CashTrack] Notification listener stopped');
};

// Track processed notification IDs to prevent duplicates
const processedNotificationIds = new Set<string>();
let isProcessing = false;

/**
 * Generate unique ID for notification based on content
 */
const generateNotificationId = (notification: BankNotification): string => {
  // Use app + time + amount as unique identifier
  const amountMatch = notification.text.match(/([+-]?[\d,\.]+)\s*(?:VND|VNĐ|đ)/i);
  const amount = amountMatch ? amountMatch[1].replace(/[,\.]/g, '') : '0';
  return `${notification.app}_${notification.time}_${amount}`;
};

/**
 * Check for new notifications from native service
 */
const checkForNewNotifications = async () => {
  // Prevent concurrent processing
  if (isProcessing) {
    return;
  }
  isProcessing = true;

  try {
    // Native saves to: /data/user/0/com.cashtrack.app/files/pending_notifications.json
    // React Native documentDirectory: file:///data/user/0/com.cashtrack.app/files/
    // These should match!
    const possiblePaths = [
      // Primary: Document directory (should match native filesDir)
      `${FileSystem.documentDirectory}pending_notifications.json`,
      // Fallback paths
      `${FileSystem.cacheDirectory}pending_notifications.json`,
    ];

    let notifications: BankNotification[] = [];
    let foundPath = '';

    for (const path of possiblePaths) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(path);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(path);
          notifications = JSON.parse(content);
          foundPath = path;
          break;
        }
      } catch (e) {
        // File doesn't exist at this path, try next
      }
    }

    if (notifications.length === 0) {
      isProcessing = false;
      return;
    }

    console.log(`[CashTrack] Found ${notifications.length} pending notifications at ${foundPath}`);

    // Count already processed
    const alreadyProcessed = notifications.filter((n: any) => n.processed).length;
    const unprocessedCount = notifications.length - alreadyProcessed;
    console.log(`[CashTrack] Status: ${alreadyProcessed} processed, ${unprocessedCount} new`);

    if (unprocessedCount === 0) {
      isProcessing = false;
      return;
    }

    // Process unprocessed notifications with deduplication
    let processedCount = 0;
    for (const notification of notifications) {
      // Skip already processed
      if (notification.processed) {
        continue;
      }

      // Generate unique ID and check if already processed in this session
      const notificationId = generateNotificationId(notification);
      if (processedNotificationIds.has(notificationId)) {
        console.log(`[CashTrack] Skipping duplicate notification: ${notificationId}`);
        notification.processed = true;
        continue;
      }

      // Process the notification
      const result = await processNotification(notification);
      
      // Mark as processed
      notification.processed = true;
      processedNotificationIds.add(notificationId);
      
      if (result) {
        processedCount++;
      }
    }

    // Save back with processed flag updated
    if (foundPath) {
      await FileSystem.writeAsStringAsync(foundPath, JSON.stringify(notifications));
      if (processedCount > 0) {
        console.log(`[CashTrack] Processed ${processedCount} new notifications`);
      }
    }

    // Clean up old IDs to prevent memory leak (keep last 100)
    if (processedNotificationIds.size > 100) {
      const idsArray = Array.from(processedNotificationIds);
      const toRemove = idsArray.slice(0, idsArray.length - 100);
      toRemove.forEach(id => processedNotificationIds.delete(id));
    }

  } catch (error) {
    // Silently fail - file might not exist yet
    console.log('[CashTrack] Error checking notifications:', error);
  } finally {
    isProcessing = false;
  }
};

/**
 * Process a single notification
 */
const processNotification = async (notification: BankNotification): Promise<ParsedTransaction | null> => {
  console.log('[CashTrack] Processing notification:', {
    app: notification.app,
    title: notification.title,
    text: notification.text?.substring(0, 100),
  });

  // Check if it's a banking notification
  if (!isBankingNotification(notification)) {
    console.log('[CashTrack] Not a banking notification, skipping');
    return null;
  }

  // Check if this app is in selected bank apps
  const settings = useSettingsStore.getState();
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
  const category = getCategoryFromTransaction(parsed);

  // Add to store
  const store = useTransactionStore.getState();

  // Check for duplicates in store
  const isDuplicate = store.transactions.some(t => 
    t.source === 'notification' && 
    t.rawNotification === parsed.rawText
  );

  if (isDuplicate) {
    console.log('[CashTrack] Duplicate transaction found in store (native bridge), skipping');
    return parsed;
  }

  store.addTransaction({
    amount: parsed.amount,
    type: parsed.type,
    category,
    description: parsed.description || '',
    merchant: parsed.merchant,
    bankAccount: parsed.bankCode,
    source: 'notification',
    rawNotification: parsed.rawText,
  });

  console.log('[CashTrack] Transaction added successfully!');

  return parsed;
};

/**
 * Manually trigger a check for new notifications
 */
export const checkNotificationsNow = async () => {
  await checkForNewNotifications();
};

/**
 * Clear all pending notifications
 */
export const clearPendingNotifications = async () => {
  const possiblePaths = [
    `${FileSystem.documentDirectory}pending_notifications.json`,
    `${FileSystem.documentDirectory}../files/pending_notifications.json`,
    `${FileSystem.cacheDirectory}pending_notifications.json`,
  ];

  for (const path of possiblePaths) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(path);
        console.log(`[CashTrack] Cleared notifications at ${path}`);
      }
    } catch (e) {
      // Ignore errors
    }
  }
};

export default {
  startNotificationListener,
  stopNotificationListener,
  checkNotificationsNow,
  clearPendingNotifications,
};
