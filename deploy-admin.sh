#!/bin/bash

# Deploy Admin Interface to Separate Firebase Project
# This script deploys the admin interface to a separate Firebase hosting site

set -e

echo "🚀 Deploying Admin Interface to Separate Domain..."

# Build the admin interface
echo "📦 Building admin interface..."
cd apps/admin
pnpm build
cd ../..

# Deploy using the admin-specific Firebase config
echo "🌐 Deploying admin interface..."
firebase deploy --only hosting --config firebase-admin.json

echo "✅ Admin interface deployed successfully!"
echo ""
echo "🔗 Admin interface should now be available at:"
echo "   https://admin-[PROJECT-ID].web.app"
echo ""
echo "📝 To set up a custom domain:"
echo "   1. Go to Firebase Console > Hosting"
echo "   2. Add custom domain (e.g., admin.monumental-i.com)"
echo "   3. Update DNS records as instructed"
