package com.cashtrack.app

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.content.Intent
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONObject
import org.json.JSONArray
import java.io.File

class NotificationListener : NotificationListenerService() {
    
    companion object {
        private const val TAG = "CashTrackNotification"
        private const val PREFS_NAME = "CashTrackNotifications"
        private const val KEY_NOTIFICATIONS = "pending_notifications"
        
        private val BANKING_APPS = listOf(
            // VCB - multiple possible package names
            "com.VCB",
            // MB Bank
            "com.mbmobile",
            "vn.com.mbbank",
            // Techcombank
            "vn.com.techcombank.bb.app",
            // ACB
            "mobile.acb.com.vn",
            "com.acb.acbmobile",
            // VPBank
            "com.vnpay.vpbankonline",
            // BIDV
            "com.vnpay.bidv",
            "com.bidv.smartbanking",
            // Vietinbank
            "com.vietinbank.ipay",
            // TPBank
            "com.tpb.mb.gprsandroid",
            "vn.tpb.mb.gprsandroid",
            // MoMo
            "com.mservice.momotransfer",
            // VNPay
            "vn.com.vnpay.customer",
            // ZaloPay
            "vn.com.vng.zalopay",
            // Agribank
            "com.vnpay.agribank"
        )
    }
    
    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn?.let { notification ->
            val packageName = notification.packageName
            val extras = notification.notification.extras
            val title = extras.getString("android.title") ?: ""
            val text = extras.getCharSequence("android.text")?.toString() ?: ""
            
            // LOG ALL NOTIFICATIONS for debugging
            Log.d(TAG, "=== NOTIFICATION RECEIVED ===")
            Log.d(TAG, "Package: $packageName")
            Log.d(TAG, "Title: $title")
            Log.d(TAG, "Text: ${text.take(100)}...")
            Log.d(TAG, "Is banking app: ${BANKING_APPS.contains(packageName)}")
            
            // Process banking apps
            if (BANKING_APPS.contains(packageName)) {
                Log.d(TAG, ">>> BANKING NOTIFICATION DETECTED! <<<")
                saveNotification(packageName, title, text, notification.postTime)
            }
        }
    }
    
    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Optional: handle notification removal
    }
    
    private fun saveNotification(app: String, title: String, text: String, time: Long) {
        try {
            val notificationData = JSONObject().apply {
                put("app", app)
                put("title", title)
                put("text", text)
                put("time", time)
                put("processed", false)
            }
            
            // Use SharedPreferences
            val prefs = applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val existingData = prefs.getString(KEY_NOTIFICATIONS, "[]") ?: "[]"
            
            val notifications = try {
                JSONArray(existingData)
            } catch (e: Exception) {
                JSONArray()
            }
            
            notifications.put(notificationData)
            
            // Keep only last 100 notifications
            while (notifications.length() > 100) {
                notifications.remove(0)
            }
            
            // Save to SharedPreferences
            prefs.edit().putString(KEY_NOTIFICATIONS, notifications.toString()).apply()
            
            // Save to internal files dir that React Native can read
            // Path: /data/user/0/com.cashtrack.app/files/pending_notifications.json
            try {
                val file = File(applicationContext.filesDir, "pending_notifications.json")
                file.writeText(notifications.toString())
                Log.d(TAG, "Saved to internal: ${file.absolutePath}")
            } catch (e: Exception) {
                Log.e(TAG, "Error saving to internal: ${e.message}")
            }
            
            Log.d(TAG, "Notification saved! Total: ${notifications.length()}")
            
            // Broadcast to React Native
            val intent = Intent("com.cashtrack.NOTIFICATION_RECEIVED")
            intent.putExtra("notification", notificationData.toString())
            sendBroadcast(intent)
            
        } catch (e: Exception) {
            Log.e(TAG, "Error saving notification: ${e.message}")
        }
    }
}
