# Google Chat Alert Setup Guide

## 🚀 **Google Chat Webhook Setup (Recommended)**

Google Chat is the **modern Google way** to send alerts - much better than email!

### **Step 1: Create Google Chat Space**
1. Go to [Google Chat](https://chat.google.com)
2. Click **"+"** → **"Create a space"**
3. Name it: **"Monumental URL Alerts"**
4. Add team members who should receive alerts

### **Step 2: Add Webhook Bot**
1. In your Chat space, click the **space name** at the top
2. Click **"Manage webhooks"**
3. Click **"Add webhook"**
4. Name: **"URL Shortener Bot"**
5. Click **"Save"**
6. **Copy the webhook URL** (looks like: `https://chat.googleapis.com/v1/spaces/.../messages?key=...&token=...`)

### **Step 3: Set Environment Variable**
Add to your Firebase Functions environment:
```bash
firebase functions:config:set google_chat.webhook_url="YOUR_WEBHOOK_URL_HERE"
```

Or add to your `.env` file:
```
GOOGLE_CHAT_WEBHOOK_URL=YOUR_WEBHOOK_URL_HERE
```

## 📧 **Email Fallback Setup (Optional)**

If Google Chat fails, it will fallback to email:

### **Gmail App Password Setup**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Factor Authentication** (required)
3. Go to **"App passwords"**
4. Generate password for **"Mail"**
5. Use this password (not your regular Gmail password)

### **Set Email Environment Variables**
```bash
firebase functions:config:set email.user="daniel@monumental-i.com" email.pass="YOUR_APP_PASSWORD"
```

## 🎯 **How It Works Now**

### **Smart Recipient Selection:**
1. **Primary**: Sends to the **user who created the link** (from `createdBy` field)
2. **Fallback**: If no `createdBy`, sends to `daniel@monumental-i.com`

### **Alert Priority:**
1. **Google Chat** (preferred - instant, rich formatting)
2. **Email** (fallback if Chat fails)

### **Rich Google Chat Message:**
- ✅ **Card format** with header and sections
- ✅ **Clickable links** for both short and long URLs
- ✅ **Location info** (city, region, country)
- ✅ **Creator info** (who created the link)
- ✅ **Professional formatting**

## 🔧 **Testing**

1. **Enable email alerts** on a test link
2. **Click the link** from a different device/browser
3. **Check Google Chat** for the alert
4. **If no Chat webhook**, check email fallback

## 📱 **Google Chat Benefits**

- ✅ **Instant notifications** (no email delays)
- ✅ **Rich formatting** with cards and buttons
- ✅ **Mobile notifications** (Google Chat app)
- ✅ **Team collaboration** (multiple people can see alerts)
- ✅ **No spam filters** (unlike email)
- ✅ **Google ecosystem** integration

This is the **modern Google way** to handle alerts!
