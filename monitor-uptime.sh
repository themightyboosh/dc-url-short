#!/bin/bash

# Monumental Link Manager - Uptime Monitoring Script
# This script monitors the health of the URL shortener service

API_URL="https://go.monumental-i.com/api/v1/health"
ADMIN_URL="https://go.monumental-i.com/admin/"
REDIRECT_TEST_URL="https://go.monumental-i.com/test-redirect"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Monumental Link Manager - Uptime Monitor"
echo "=========================================="
echo ""

# Function to check HTTP response
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "✅ ${GREEN}$name${NC}: OK (HTTP $response)"
        return 0
    else
        echo -e "❌ ${RED}$name${NC}: FAILED (HTTP $response)"
        return 1
    fi
}

# Function to check API health endpoint
check_api_health() {
    echo "🏥 Checking API Health..."
    
    response=$(curl -s "$API_URL" --max-time 10)
    if [ $? -eq 0 ]; then
        status=$(echo "$response" | jq -r '.data.status' 2>/dev/null)
        response_time=$(echo "$response" | jq -r '.data.responseTime' 2>/dev/null)
        db_status=$(echo "$response" | jq -r '.data.services.database' 2>/dev/null)
        
        if [ "$status" = "healthy" ]; then
            echo -e "✅ ${GREEN}API Health${NC}: $status"
            echo -e "📊 ${GREEN}Response Time${NC}: $response_time"
            echo -e "🗄️  ${GREEN}Database${NC}: $db_status"
        else
            echo -e "⚠️  ${YELLOW}API Health${NC}: $status (degraded)"
            echo -e "📊 ${YELLOW}Response Time${NC}: $response_time"
            echo -e "🗄️  ${YELLOW}Database${NC}: $db_status"
        fi
    else
        echo -e "❌ ${RED}API Health${NC}: Connection failed"
    fi
    echo ""
}

# Function to test redirect functionality
test_redirect() {
    echo "🔗 Testing Redirect Functionality..."
    
    # Test with a non-existent slug (should return 404)
    response=$(curl -s -o /dev/null -w "%{http_code}" "https://go.monumental-i.com/nonexistent-slug" --max-time 10)
    if [ "$response" -eq "404" ]; then
        echo -e "✅ ${GREEN}Redirect Logic${NC}: Correctly handles invalid slugs"
    else
        echo -e "❌ ${RED}Redirect Logic${NC}: Unexpected response (HTTP $response)"
    fi
    echo ""
}

# Main monitoring function
main() {
    local overall_status=0
    
    # Check API health endpoint
    check_api_health
    
    # Check admin panel
    check_endpoint "$ADMIN_URL" "Admin Panel" 200
    if [ $? -ne 0 ]; then overall_status=1; fi
    
    # Check API endpoints
    check_endpoint "$API_URL" "Health Check API" 200
    if [ $? -ne 0 ]; then overall_status=1; fi
    
    # Test redirect functionality
    test_redirect
    
    # Summary
    echo "📋 Summary"
    echo "=========="
    if [ $overall_status -eq 0 ]; then
        echo -e "🎉 ${GREEN}All systems operational${NC}"
        echo -e "⏰ $(date)"
    else
        echo -e "⚠️  ${YELLOW}Some issues detected${NC}"
        echo -e "⏰ $(date)"
        echo ""
        echo "🔧 Troubleshooting Steps:"
        echo "1. Check Firebase Console for function logs"
        echo "2. Verify Firestore database connectivity"
        echo "3. Check Firebase Hosting status"
        echo "4. Review Cloud Functions metrics"
    fi
}

# Run the monitoring
main
