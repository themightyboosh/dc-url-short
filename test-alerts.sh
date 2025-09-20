#!/bin/bash

# Test Google Chat Alert System
echo "🧪 Testing Monumental URL Shortener Alert System"
echo "================================================"
echo ""

# Test 1: Check if we have a test link
echo "1️⃣ Checking for test links..."
TEST_LINK=$(curl -s "https://us-central1-moni-url-short.cloudfunctions.net/api/api/v1/links" \
  -H "Authorization: Bearer $(firebase auth:export --format=json | jq -r '.users[0].customToken')" | \
  jq -r '.data[0].slug // empty')

if [ -z "$TEST_LINK" ]; then
    echo "❌ No test links found. Please create a test link first."
    echo "   Go to: https://go.monumental-i.com/admin/"
    exit 1
fi

echo "✅ Found test link: $TEST_LINK"
echo ""

# Test 2: Enable email alerts on the test link
echo "2️⃣ Enabling email alerts on test link..."
curl -X PATCH "https://us-central1-moni-url-short.cloudfunctions.net/api/api/v1/links/$TEST_LINK" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(firebase auth:export --format=json | jq -r '.users[0].customToken')" \
  -d '{"emailAlerts": true}' \
  -s | jq -r '.message // "Failed to enable alerts"'

echo ""
echo "✅ Email alerts enabled on $TEST_LINK"
echo ""

# Test 3: Test the redirect (this should trigger an alert)
echo "3️⃣ Testing redirect (this will trigger an alert)..."
echo "   Clicking: https://go.monumental-i.com/$TEST_LINK"
echo ""

# Make the actual request
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://go.monumental-i.com/$TEST_LINK")
echo "   HTTP Response: $HTTP_CODE"

if [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "✅ Redirect successful - alert should have been sent!"
    echo ""
    echo "📱 Check your Google Chat space for the alert"
    echo "📧 Or check daniel@monumental-i.com for email fallback"
else
    echo "❌ Redirect failed - no alert sent"
fi

echo ""
echo "🔧 To set up Google Chat webhook:"
echo "   1. Go to https://chat.google.com"
echo "   2. Create a space called 'Monumental URL Alerts'"
echo "   3. Add webhook bot to the space"
echo "   4. Copy the webhook URL"
echo "   5. Set GOOGLE_CHAT_WEBHOOK_URL environment variable"
echo ""
echo "📖 See GOOGLE_CHAT_SETUP.md for detailed instructions"
