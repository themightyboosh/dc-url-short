#!/bin/bash

# Simple Admin Deployment Script
# This script builds and prepares the admin interface for deployment

set -e

echo "🚀 Preparing Admin Interface..."

# Build the admin interface
echo "📦 Building admin interface..."
cd apps/admin
pnpm build
cd ../..

echo "✅ Admin interface built successfully!"
echo ""
echo "📁 Built files are in: apps/admin/dist/"
echo ""
echo "🌐 To deploy:"
echo "   1. Run: firebase deploy --only hosting"
echo "   2. Or use: ./deploy-admin.sh (for separate domain)"
echo ""
echo "🔧 Current Firebase config:"
echo "   - /api/** → API functions"
echo "   - /admin/** → Admin SPA"
echo "   - /[slug] → Redirect function"
echo ""
echo "🔗 Admin should be available at: https://go.monumental-i.com/admin"
