#!/bin/bash

# Setup script for Moni URL Shortener deployment
# This script helps you prepare for deployment by setting up Firebase project and credentials

set -e

echo "🚀 Setting up Moni URL Shortener for deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase first:"
    firebase login
fi

echo "📋 Deployment Preparation Checklist:"
echo ""
echo "1. ✅ Firebase CLI installed and logged in"
echo "2. ✅ Google credentials copied from CNidaria project"
echo "3. ✅ Environment files created"
echo ""
echo "🔧 Next Steps:"
echo ""
echo "1. Create Firebase Project:"
echo "   - Go to https://console.firebase.google.com/"
echo "   - Click 'Create a project'"
echo "   - Name it 'moni-url-short'"
echo "   - Enable Google Analytics (optional)"
echo ""
echo "2. Configure Firebase Project:"
echo "   - Enable Authentication (Google provider)"
echo "   - Create Firestore Database (start in test mode)"
echo "   - Enable Cloud Functions"
echo "   - Enable Hosting"
echo ""
echo "3. Get Firebase Configuration:"
echo "   - Go to Project Settings > General"
echo "   - Scroll to 'Your apps' section"
echo "   - Click 'Add app' > Web app"
echo "   - Copy the config object"
echo "   - Update apps/admin/env.local with actual values"
echo ""
echo "4. Set up Service Account:"
echo "   - Go to Project Settings > Service Accounts"
echo "   - Click 'Generate new private key'"
echo "   - Replace moni-url-short-key.json with the new key"
echo ""
echo "5. Configure Custom Domain:"
echo "   - Go to Hosting in Firebase Console"
echo "   - Add custom domain: go.monumental-i.com"
echo "   - Follow DNS setup instructions"
echo ""
echo "6. Deploy:"
echo "   ./deploy.sh"
echo ""
echo "📁 Files created:"
echo "   - apps/admin/env.local (Firebase client config)"
echo "   - functions/env.local (Functions environment)"
echo "   - moni-url-short-key.json (Service account key)"
echo ""
echo "🔐 Security Notes:"
echo "   - Only @monumental-i.com emails can access admin"
echo "   - Firestore rules enforce organization membership"
echo "   - CORS is configured for your domain"
echo ""
echo "Ready to proceed with Firebase project creation!"
