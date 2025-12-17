package com.cashtrack.app

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class WebhookConfigModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "WebhookConfigModule"
        private const val WEBHOOK_PREFS = "CashTrackWebhooks"
    }
    
    override fun getName(): String = "WebhookConfigModule"
    
    /**
     * Save webhooks configuration to SharedPreferences
     * This allows the NotificationListener service to read webhooks in background
     */
    @ReactMethod
    fun saveWebhooks(webhooksJson: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(WEBHOOK_PREFS, Context.MODE_PRIVATE)
            prefs.edit().putString("webhooks", webhooksJson).apply()
            Log.d(TAG, "Webhooks saved to SharedPreferences: $webhooksJson")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error saving webhooks: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }
    
    /**
     * Get webhooks from SharedPreferences
     */
    @ReactMethod
    fun getWebhooks(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(WEBHOOK_PREFS, Context.MODE_PRIVATE)
            val webhooksJson = prefs.getString("webhooks", "[]") ?: "[]"
            Log.d(TAG, "Webhooks loaded from SharedPreferences: $webhooksJson")
            promise.resolve(webhooksJson)
        } catch (e: Exception) {
            Log.e(TAG, "Error loading webhooks: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }
    
    /**
     * Clear webhooks from SharedPreferences
     */
    @ReactMethod
    fun clearWebhooks(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(WEBHOOK_PREFS, Context.MODE_PRIVATE)
            prefs.edit().remove("webhooks").apply()
            Log.d(TAG, "Webhooks cleared from SharedPreferences")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing webhooks: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }
}
