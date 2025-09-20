# 🧪 Manual Alert Testing Guide

## **Step 1: Enable Email Alerts**
1. Go to: https://go.monumental-i.com/admin/
2. Sign in with your @monumental-i.com account
3. Find the "lets-talk" link in the table
4. Click the **analytics icon** (bar chart) to go to link details
5. **Enable the "Email Alerts" checkbox**
6. Click **Save** (if there's a save button)

## **Step 2: Test the Alert**
1. **Open a new incognito/private browser window**
2. **Go to**: https://go.monumental-i.com/lets-talk
3. **You should be redirected** to the Google Calendar link
4. **Check for alerts** in:
   - Google Chat (if webhook is set up)
   - Email inbox (daniel@monumental-i.com)

## **Step 3: Check Function Logs**
Run this command to see if the alert was triggered:
```bash
firebase functions:log | grep -E "(alert|email|chat|lets-talk)"
```

## **Step 4: Set Up Google Chat (Optional)**
If you want Google Chat alerts instead of email:

1. **Go to**: https://chat.google.com
2. **Create a space**: "Monumental URL Alerts"
3. **Add webhook bot** to the space
4. **Copy the webhook URL**
5. **Set environment variable**:
   ```bash
   firebase functions:config:set google_chat.webhook_url="YOUR_WEBHOOK_URL"
   ```
6. **Redeploy functions**:
   ```bash
   firebase deploy --only functions
   ```

## **Expected Results**

### **If Email Alerts Work:**
- You'll get an email to daniel@monumental-i.com
- Subject: "🔗 Link Click: lets-talk - [Location]"
- Rich HTML content with link details

### **If Google Chat Works:**
- You'll get a rich card message in Google Chat
- Clickable links and professional formatting
- Instant notification

### **If Nothing Happens:**
- Check function logs for errors
- Verify email alerts are enabled on the link
- Check spam folder for emails

## **Troubleshooting**

**No alerts sent?**
- Check if `emailAlerts: true` on the link
- Check function logs for errors
- Verify environment variables are set

**Email in spam?**
- Add daniel@monumental-i.com to contacts
- Check spam folder

**Google Chat not working?**
- Verify webhook URL is correct
- Check if webhook bot is added to space
- Test webhook URL manually

Let me know what happens when you test it!
