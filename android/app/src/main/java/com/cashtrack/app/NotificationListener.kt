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
import java.net.HttpURLConnection
import java.net.URL
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlin.concurrent.thread

class NotificationListener : NotificationListenerService() {
    
    companion object {
        private const val TAG = "CashTrackNotification"
        private const val PREFS_NAME = "CashTrackNotifications"
        private const val WEBHOOK_PREFS = "CashTrackWebhooks"
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
        
        // Advertisement keywords to filter out (Vietnamese with and without diacritics)
        private val ADVERTISEMENT_KEYWORDS = listOf(
            "khuyến mãi", "khuyen mai", "ưu đãi", "uu dai",
            "giảm giá", "giam gia", "sale", "promotion",
            "miễn phí", "mien phi", "free", "không phí", "khong phi",
            "hoàn tiền", "hoan tien", "cashback",
            "tặng", "tang", "quà tặng", "qua tang",
            "đặc quyền", "dac quyen", "privilege",
            "thẻ tín dụng", "the tin dung", "credit card",
            "đăng ký", "dang ky", "register", "sign up",
            "mở thẻ", "mo the", "apply card",
            "flash sale", "hot deal", "deal sốc", "deal soc",
            "voucher", "coupon", "mã giảm", "ma giam",
            "tận hưởng", "tan huong", "trải nghiệm", "trai nghiem",
            "chương trình", "chuong trinh", "program",
            "sự kiện", "su kien", "event",
            "thả ga", "tha ga", "không lo", "khong lo",
            "du lịch", "du lich", "travel",
            "mua sắm", "mua sam",
            "điểm thưởng", "diem thuong", "reward points",
            "tích điểm", "tich diem", "earn points",
            "jcb", "visa platinum", "mastercard gold",
            "liên kết", "lien ket", "link",
            "kích hoạt", "kich hoat", "activate",
            "0%", "0 đồng", "0đ", "0 dong",
            "trúng thưởng", "trung thuong", "win",
            "quay số", "quay so", "lucky draw",
            "nâng cấp", "nang cap", "upgrade",
            "vay", "loan", "tín dụng", "tin dung",
            "gói dịch vụ", "goi dich vu", "service package"
        )
        
        // Keywords that indicate real transaction (priority over ad keywords)
        private val TRANSACTION_KEYWORDS = listOf(
            "số dư", "so du", "balance",
            "giao dịch thành công", "giao dich thanh cong",
            "biến động số dư", "bien dong so du",
            "chuyển khoản thành công", "chuyen khoan thanh cong",
            "thanh toán thành công", "thanh toan thanh cong",
            "đã nhận", "da nhan", "received",
            "đã chuyển", "da chuyen", "transferred",
            "gd:", "stk:", "tk:",
            "ma gd", "mã gd"
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
                val fullText = "$title $text".lowercase()
                
                // Check if it's an advertisement
                if (isAdvertisement(fullText)) {
                    Log.d(TAG, ">>> FILTERED: Advertisement notification <<<")
                    return@let
                }
                
                Log.d(TAG, ">>> BANKING NOTIFICATION DETECTED! <<<")
                saveNotification(packageName, title, text, notification.postTime)
                
                // Send webhook in background thread
                thread {
                    sendWebhookNotification(packageName, title, text, notification.postTime)
                }
            }
        }
    }
    
    /**
     * Check if notification is an advertisement/promotional message
     */
    private fun isAdvertisement(text: String): Boolean {
        val lowerText = text.lowercase()
        
        // Check for transaction priority keywords first
        val hasTransactionKeyword = TRANSACTION_KEYWORDS.any { lowerText.contains(it) }
        if (hasTransactionKeyword) {
            return false // Real transaction, not an ad
        }
        
        // Count advertisement keywords
        val adKeywordCount = ADVERTISEMENT_KEYWORDS.count { lowerText.contains(it) }
        
        // If 2+ ad keywords, it's likely an advertisement
        if (adKeywordCount >= 2) {
            Log.d(TAG, "Advertisement detected: $adKeywordCount keywords found")
            return true
        }
        
        return false
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
    
    /**
     * Send webhook notification directly from background service
     */
    private fun sendWebhookNotification(app: String, title: String, text: String, time: Long) {
        try {
            // Try multiple sources for webhook configuration
            var webhooks = JSONArray()
            
            // Source 1: SharedPreferences (if native writes directly)
            val prefs = applicationContext.getSharedPreferences(WEBHOOK_PREFS, Context.MODE_PRIVATE)
            val webhooksJson = prefs.getString("webhooks", null)
            if (webhooksJson != null && webhooksJson != "[]") {
                webhooks = JSONArray(webhooksJson)
            }
            
            // Source 2: File saved by React Native (more reliable)
            if (webhooks.length() == 0) {
                try {
                    val file = File(applicationContext.filesDir, "webhooks_config.json")
                    if (file.exists()) {
                        val content = file.readText()
                        webhooks = JSONArray(content)
                        Log.d(TAG, "Loaded webhooks from file: ${webhooks.length()} webhooks")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error reading webhooks file: ${e.message}")
                }
            }
            
            if (webhooks.length() == 0) {
                Log.d(TAG, "No webhooks configured")
                return
            }
            
            // Create payload
            val payload = JSONObject().apply {
                put("event", "notification.received")
                put("timestamp", System.currentTimeMillis())
                put("data", JSONObject().apply {
                    put("app", app)
                    put("title", title)
                    put("text", text)
                    put("time", time)
                    put("source", "background_service")
                })
            }
            
            // Send to all enabled webhooks
            for (i in 0 until webhooks.length()) {
                val webhook = webhooks.getJSONObject(i)
                val enabled = webhook.optBoolean("enabled", false)
                val events = webhook.optJSONArray("events") ?: JSONArray()
                
                // Check if enabled and event matches
                if (!enabled) continue
                
                var hasEvent = false
                for (j in 0 until events.length()) {
                    if (events.getString(j) == "notification.received" || 
                        events.getString(j) == "transaction.created") {
                        hasEvent = true
                        break
                    }
                }
                if (!hasEvent) continue
                
                val url = webhook.getString("url")
                val secret = webhook.optString("secret", "")
                
                try {
                    sendHttpWebhook(url, payload.toString(), secret)
                    Log.d(TAG, "Webhook sent successfully to: $url")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to send webhook to $url: ${e.message}")
                    // Queue failed webhook for retry
                    queueWebhookForRetry(url, payload.toString(), secret)
                }
            }
            
            // Process any queued webhooks if we have internet
            processWebhookQueue()
            
        } catch (e: Exception) {
            Log.e(TAG, "Error sending webhooks: ${e.message}")
        }
    }
    
    /**
     * Queue a failed webhook for later retry
     */
    private fun queueWebhookForRetry(url: String, payload: String, secret: String) {
        try {
            val queueFile = File(applicationContext.filesDir, "webhook_queue.json")
            val queue = if (queueFile.exists()) {
                try {
                    JSONArray(queueFile.readText())
                } catch (e: Exception) {
                    JSONArray()
                }
            } else {
                JSONArray()
            }
            
            // Add to queue with timestamp and retry count
            val queueItem = JSONObject().apply {
                put("url", url)
                put("payload", payload)
                put("secret", secret)
                put("timestamp", System.currentTimeMillis())
                put("retryCount", 0)
            }
            
            queue.put(queueItem)
            
            // Keep only last 50 queued webhooks
            while (queue.length() > 50) {
                queue.remove(0)
            }
            
            queueFile.writeText(queue.toString())
            Log.d(TAG, "Webhook queued for retry. Queue size: ${queue.length()}")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error queuing webhook: ${e.message}")
        }
    }
    
    /**
     * Process queued webhooks (called when we have internet)
     */
    private fun processWebhookQueue() {
        try {
            val queueFile = File(applicationContext.filesDir, "webhook_queue.json")
            if (!queueFile.exists()) return
            
            val queue = try {
                JSONArray(queueFile.readText())
            } catch (e: Exception) {
                return
            }
            
            if (queue.length() == 0) return
            
            Log.d(TAG, "Processing webhook queue: ${queue.length()} items")
            
            val remainingQueue = JSONArray()
            
            for (i in 0 until queue.length()) {
                val item = queue.getJSONObject(i)
                val url = item.getString("url")
                val payload = item.getString("payload")
                val secret = item.optString("secret", "")
                val retryCount = item.optInt("retryCount", 0)
                val timestamp = item.optLong("timestamp", 0)
                
                // Skip if too old (older than 24 hours)
                if (System.currentTimeMillis() - timestamp > 24 * 60 * 60 * 1000) {
                    Log.d(TAG, "Skipping expired webhook (older than 24h)")
                    continue
                }
                
                // Skip if too many retries
                if (retryCount >= 5) {
                    Log.d(TAG, "Skipping webhook with too many retries ($retryCount)")
                    continue
                }
                
                try {
                    sendHttpWebhook(url, payload, secret)
                    Log.d(TAG, "Queued webhook sent successfully to: $url")
                } catch (e: Exception) {
                    Log.e(TAG, "Retry failed for $url: ${e.message}")
                    // Re-queue with incremented retry count
                    item.put("retryCount", retryCount + 1)
                    remainingQueue.put(item)
                }
            }
            
            // Save remaining queue
            if (remainingQueue.length() > 0) {
                queueFile.writeText(remainingQueue.toString())
                Log.d(TAG, "Remaining queued webhooks: ${remainingQueue.length()}")
            } else {
                queueFile.delete()
                Log.d(TAG, "Webhook queue cleared")
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error processing webhook queue: ${e.message}")
        }
    }
    
    /**
     * Send HTTP POST webhook request
     */
    private fun sendHttpWebhook(urlString: String, payload: String, secret: String) {
        val url = URL(urlString)
        val connection = url.openConnection() as HttpURLConnection
        
        try {
            connection.requestMethod = "POST"
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("User-Agent", "CashTrack-Webhook/1.0-Background")
            connection.setRequestProperty("X-Webhook-Event", "notification.received")
            connection.setRequestProperty("X-Webhook-Source", "background_service")
            connection.connectTimeout = 10000
            connection.readTimeout = 10000
            
            // Add HMAC signature if secret is provided
            if (secret.isNotEmpty()) {
                val signature = generateHmacSignature(payload, secret)
                connection.setRequestProperty("X-Webhook-Signature", signature)
            }
            
            // Write payload
            connection.outputStream.use { os ->
                os.write(payload.toByteArray(Charsets.UTF_8))
            }
            
            val responseCode = connection.responseCode
            Log.d(TAG, "Webhook response code: $responseCode")
            
            // Throw exception if not successful
            if (responseCode !in 200..299) {
                throw Exception("HTTP $responseCode")
            }
            
        } finally {
            connection.disconnect()
        }
    }
    
    /**
     * Generate HMAC-SHA256 signature
     */
    private fun generateHmacSignature(payload: String, secret: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        val secretKeySpec = SecretKeySpec(secret.toByteArray(Charsets.UTF_8), "HmacSHA256")
        mac.init(secretKeySpec)
        val hmacBytes = mac.doFinal(payload.toByteArray(Charsets.UTF_8))
        return "sha256=" + hmacBytes.joinToString("") { "%02x".format(it) }
    }
}
