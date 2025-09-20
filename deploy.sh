#!/bin/bash

# Deploy script for Moni URL Shortener
# This script handles the complete deployment process

set -e

echo "🚀 Starting deployment of Moni URL Shortener..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "pnpm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase first:"
    firebase login
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build admin app
echo "🏗️ Building admin app..."
cd apps/admin
pnpm install
pnpm run build
cd ../..

# Build functions
echo "🏗️ Building Cloud Functions..."
cd functions
pnpm install
pnpm run build
cd ..

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your URL shortener is now live at:"
echo "   Admin Panel: https://go.monumental-i.com/admin"
echo "   API Docs: https://go.monumental-i.com/admin/api-docs"
echo ""
echo "📋 Next steps:"
echo "   1. Configure your custom domain (go.monumental-i.com) in Firebase Hosting"
echo "   2. Set up environment variables in Firebase Functions"
echo "   3. Configure Firestore security rules"
echo "   4. Test the deployment"
