#!/bin/bash

# Test script for Google Docs integration with URL Shortener
# This script tests the webhook endpoint for creating short links from Google Docs

echo "🧪 Testing Google Docs Integration with URL Shortener"
echo "=================================================="

# Configuration
API_BASE_URL="https://go.monumental-i.com/api/v1"
TEST_DOC_URL="https://docs.google.com/document/d/1ABC123DEF456GHI789JKL/edit"
TEST_DOC_NAME="Test Resume Document"
TEST_USER_EMAIL="daniel@monumental-i.com"

echo "📋 Test Configuration:"
echo "  API Base URL: $API_BASE_URL"
echo "  Test Doc URL: $TEST_DOC_URL"
echo "  Test Doc Name: $TEST_DOC_NAME"
echo "  User Email: $TEST_USER_EMAIL"
echo ""

# Test 1: Health Check
echo "🔍 Test 1: Health Check"
echo "----------------------"
HEALTH_RESPONSE=$(curl -s "$API_BASE_URL/health")
echo "Response: $HEALTH_RESPONSE"
echo ""

# Test 2: Create Google Docs Short Link
echo "🔗 Test 2: Create Google Docs Short Link"
echo "--------------------------------------"
WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "docUrl": "$TEST_DOC_URL",
  "docName": "$TEST_DOC_NAME",
  "docId": "1ABC123DEF456GHI789JKL",
  "createdBy": "$TEST_USER_EMAIL",
  "tags": ["resume", "test"],
  "emailAlerts": true
}
EOF
)

echo "Payload: $WEBHOOK_PAYLOAD"
echo ""

WEBHOOK_RESPONSE=$(curl -s -X POST "$API_BASE_URL/google-docs/webhook" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_PAYLOAD")

echo "Response: $WEBHOOK_RESPONSE"
echo ""

# Test 3: List Google Docs Links
echo "📋 Test 3: List Google Docs Links"
echo "--------------------------------"
LINKS_RESPONSE=$(curl -s "$API_BASE_URL/google-docs/links")
echo "Response: $LINKS_RESPONSE"
echo ""

# Test 4: Batch Create Google Docs Links
echo "📦 Test 4: Batch Create Google Docs Links"
echo "----------------------------------------"
BATCH_PAYLOAD=$(cat <<EOF
{
  "docs": [
    {
      "docUrl": "https://docs.google.com/document/d/1DOC1/edit",
      "docName": "Resume Template",
      "createdBy": "$TEST_USER_EMAIL",
      "customSlug": "resume-template",
      "tags": ["resume", "template"]
    },
    {
      "docUrl": "https://docs.google.com/document/d/1DOC2/edit",
      "docName": "Cover Letter Template",
      "createdBy": "$TEST_USER_EMAIL",
      "customSlug": "cover-letter-template",
      "tags": ["cover-letter", "template"]
    }
  ]
}
EOF
)

echo "Batch Payload: $BATCH_PAYLOAD"
echo ""

BATCH_RESPONSE=$(curl -s -X POST "$API_BASE_URL/google-docs/batch" \
  -H "Content-Type: application/json" \
  -d "$BATCH_PAYLOAD")

echo "Response: $BATCH_RESPONSE"
echo ""

# Test 5: Test Redirect
echo "🔄 Test 5: Test Redirect"
echo "----------------------"
echo "Testing redirect for created links..."

# Extract slug from webhook response (if successful)
SLUG=$(echo "$WEBHOOK_RESPONSE" | jq -r '.data.slug // empty')
if [ -n "$SLUG" ]; then
  echo "Testing redirect for slug: $SLUG"
  REDIRECT_RESPONSE=$(curl -I "https://go.monumental-i.com/$SLUG" 2>/dev/null | head -1)
  echo "Redirect Response: $REDIRECT_RESPONSE"
else
  echo "No slug found in response, skipping redirect test"
fi

echo ""
echo "✅ Google Docs Integration Test Complete!"
echo "========================================="
echo ""
echo "📝 Next Steps:"
echo "1. Set up Google Apps Script with the provided code"
echo "2. Configure triggers for automatic short link creation"
echo "3. Test with real Google Docs"
echo "4. Monitor the admin panel for created links"
echo ""
echo "🔗 Admin Panel: https://go.monumental-i.com/admin/"
echo "📊 API Documentation: https://go.monumental-i.com/api/v1/docs"

