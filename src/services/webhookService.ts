// Webhook Service for sending transaction data to third-party services
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { Transaction } from '../types';

// Native SharedPreferences key (must match Kotlin code)
const NATIVE_WEBHOOK_PREFS = 'CashTrackWebhooks';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  secret?: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  createdAt: Date;
  lastTriggeredAt?: Date;
  failCount: number;
}

export type WebhookEvent = 
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.deleted'
  | 'budget.exceeded'
  | 'budget.warning'
  | 'daily.summary'
  | 'weekly.summary'
  | 'monthly.summary'
  | 'notification.received'; // New event for background notifications

export interface WebhookPayload {
  event: WebhookEvent | string;
  timestamp: string;
  data: any;
}

export interface WebhookDeliveryResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  timestamp: Date;
}

const WEBHOOKS_STORAGE_KEY = 'cashtrack-webhooks';
const WEBHOOK_LOGS_KEY = 'cashtrack-webhook-logs';

class WebhookService {
  private webhooks: WebhookConfig[] = [];
  private isLoaded: boolean = false;

  async loadWebhooks(): Promise<WebhookConfig[]> {
    try {
      const stored = await AsyncStorage.getItem(WEBHOOKS_STORAGE_KEY);
      if (stored) {
        this.webhooks = JSON.parse(stored).map((w: any) => ({
          ...w,
          createdAt: new Date(w.createdAt),
          lastTriggeredAt: w.lastTriggeredAt ? new Date(w.lastTriggeredAt) : undefined,
        }));
      }
      this.isLoaded = true;
      
      // Sync to native SharedPreferences for background webhook sending
      await this.syncToNative();
      
      return this.webhooks;
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      return [];
    }
  }

  private async saveWebhooks(): Promise<void> {
    try {
      await AsyncStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(this.webhooks));
      
      // Sync to native SharedPreferences for background webhook sending
      await this.syncToNative();
    } catch (error) {
      console.error('Failed to save webhooks:', error);
    }
  }

  /**
   * Sync webhooks to native Android SharedPreferences
   * This allows the NotificationListener service to send webhooks in the background
   */
  private async syncToNative(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      // Format webhooks for native consumption (simplified structure)
      const nativeWebhooks = this.webhooks.map(w => ({
        id: w.id,
        url: w.url,
        enabled: w.enabled,
        secret: w.secret || '',
        events: w.events,
      }));

      const webhookData = JSON.stringify(nativeWebhooks);
      
      // Method 1: Use native module to write directly to SharedPreferences (MOST RELIABLE)
      try {
        const { WebhookConfigModule } = NativeModules;
        if (WebhookConfigModule && WebhookConfigModule.saveWebhooks) {
          await WebhookConfigModule.saveWebhooks(webhookData);
          console.log('[CashTrack] Webhooks synced to native SharedPreferences via module');
        }
      } catch (nativeError) {
        console.log('[CashTrack] Native module not available, using file fallback');
      }
      
      // Method 2: Also save to file as fallback
      try {
        const FileSystem = require('expo-file-system');
        if (FileSystem && FileSystem.documentDirectory) {
          const filePath = `${FileSystem.documentDirectory}webhooks_config.json`;
          await FileSystem.writeAsStringAsync(filePath, webhookData);
          console.log('[CashTrack] Webhooks also saved to file:', filePath);
        }
      } catch (fileError) {
        console.log('[CashTrack] File save failed:', fileError);
      }

      // Method 3: Store in AsyncStorage as backup
      await AsyncStorage.setItem('@native_webhooks', webhookData);
      
    } catch (error) {
      console.log('[CashTrack] Failed to sync webhooks to native:', error);
    }
  }

  /**
   * Force sync webhooks to native (public method)
   * Call this to ensure native code has the latest webhook config
   */
  async forceSyncToNative(): Promise<boolean> {
    try {
      await this.syncToNative();
      return true;
    } catch (error) {
      console.error('[CashTrack] Force sync failed:', error);
      return false;
    }
  }

  getWebhooks(): WebhookConfig[] {
    return this.webhooks;
  }

  getWebhookById(id: string): WebhookConfig | undefined {
    return this.webhooks.find(w => w.id === id);
  }

  async addWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt' | 'failCount'>): Promise<WebhookConfig> {
    const newWebhook: WebhookConfig = {
      ...config,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      createdAt: new Date(),
      failCount: 0,
    };

    this.webhooks.push(newWebhook);
    await this.saveWebhooks();
    return newWebhook;
  }

  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<boolean> {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.webhooks[index] = { ...this.webhooks[index], ...updates };
    await this.saveWebhooks();
    return true;
  }

  async deleteWebhook(id: string): Promise<boolean> {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.webhooks.splice(index, 1);
    await this.saveWebhooks();
    return true;
  }

  async toggleWebhook(id: string): Promise<boolean> {
    const webhook = this.webhooks.find(w => w.id === id);
    if (!webhook) return false;

    webhook.enabled = !webhook.enabled;
    await this.saveWebhooks();
    return true;
  }

  private generateSignature(payload: string, secret: string): string {
    let hash = 0;
    const combined = payload + secret;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `sha256=${Math.abs(hash).toString(16)}`;
  }

  private async sendWebhook(
    webhook: WebhookConfig, 
    payload: WebhookPayload
  ): Promise<WebhookDeliveryResult> {
    const payloadString = JSON.stringify(payload);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CashTrack-Webhook/1.0',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Delivery': Date.now().toString(),
      ...webhook.headers,
    };

    if (webhook.secret) {
      headers['X-Webhook-Signature'] = this.generateSignature(payloadString, webhook.secret);
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
      });

      const success = response.ok;
      
      const index = this.webhooks.findIndex(w => w.id === webhook.id);
      if (index >= 0) {
        this.webhooks[index].lastTriggeredAt = new Date();
        if (!success) {
          this.webhooks[index].failCount++;
        } else {
          this.webhooks[index].failCount = 0;
        }
        await this.saveWebhooks();
      }

      return {
        webhookId: webhook.id,
        success,
        statusCode: response.status,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const index = this.webhooks.findIndex(w => w.id === webhook.id);
      if (index >= 0) {
        this.webhooks[index].failCount++;
        await this.saveWebhooks();
      }

      return {
        webhookId: webhook.id,
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  async trigger(event: WebhookEvent, data: any): Promise<WebhookDeliveryResult[]> {
    if (!this.isLoaded) {
      await this.loadWebhooks();
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const eligibleWebhooks = this.webhooks.filter(
      w => w.enabled && w.events.includes(event) && w.failCount < 5
    );

    const results = await Promise.all(
      eligibleWebhooks.map(w => this.sendWebhook(w, payload))
    );

    return results;
  }

  async onTransactionCreated(transaction: Transaction): Promise<void> {
    await this.trigger('transaction.created', {
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        merchant: transaction.merchant,
        createdAt: transaction.createdAt,
      },
    });
  }

  async onTransactionUpdated(transaction: Transaction): Promise<void> {
    await this.trigger('transaction.updated', {
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        merchant: transaction.merchant,
        updatedAt: transaction.updatedAt,
      },
    });
  }

  async onTransactionDeleted(transactionId: string): Promise<void> {
    await this.trigger('transaction.deleted', { transactionId });
  }

  async testWebhook(webhook: WebhookConfig): Promise<WebhookDeliveryResult> {
    const testPayload: WebhookPayload = {
      event: 'transaction.created',
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook from CashTrack',
      },
    };

    return this.sendWebhook(webhook, testPayload);
  }
}

export const webhookService = new WebhookService();
export default webhookService;
