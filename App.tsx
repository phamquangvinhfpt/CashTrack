import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AppNavigator } from './src/navigation';
import { startNotificationListener, stopNotificationListener } from './src/services/nativeNotificationBridge';
import { showOnboardingPermissionPrompt, showNotificationPermissionDialog } from './src/utils/permissionUtils';
import { useSettingsStore } from './src/store';
import { webhookService } from './src/services/webhookService';

const PERMISSION_PROMPT_SHOWN_KEY = 'cashtrack_permission_prompt_shown';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Start listening for notifications from native service
        startNotificationListener();

        // Load and sync webhooks to native (important for background webhook sending)
        if (Platform.OS === 'android') {
          await webhookService.loadWebhooks();
          console.log('[CashTrack] Webhooks loaded and synced to native');
        }

        // Check if we should show permission prompt (only on Android)
        if (Platform.OS === 'android') {
          const promptShown = await AsyncStorage.getItem(PERMISSION_PROMPT_SHOWN_KEY);

          if (!promptShown) {
            // First time opening app - show onboarding prompt
            await showOnboardingPermissionPrompt();
            await AsyncStorage.setItem(PERMISSION_PROMPT_SHOWN_KEY, 'true');
          }
        }
      } catch (error) {
        console.log('[CashTrack] Error during initialization:', error);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();

    return () => {
      stopNotificationListener();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
