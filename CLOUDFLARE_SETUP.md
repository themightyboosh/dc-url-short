# Cloudflare Setup for go.monumental-i.com

## Current Status
✅ Firebase hosting site created: `go-monumental-i`  
✅ Admin interface deployed to: `https://go-monumental-i.web.app`  
⚠️ Custom domain `go.monumental-i.com` needs Cloudflare configuration

## Step-by-Step Cloudflare Setup

### 1. Firebase Console Configuration
1. Go to: https://console.firebase.google.com/project/moni-url-short/hosting/sites/go-monumental-i
2. Click "Add custom domain"
3. Enter: `go.monumental-i.com`
4. Firebase will provide DNS records (save these!)

### 2. Cloudflare DNS Configuration
In your Cloudflare dashboard for `monumental-i.com`:

#### Option A: CNAME Record (Recommended)
```
Type: CNAME
Name: go
Target: go-monumental-i.web.app
Proxy status: Proxied (orange cloud)
TTL: Auto
```

#### Option B: A Record (if CNAME not supported)
```
Type: A
Name: go
IPv4 address: [Firebase IP from step 1]
Proxy status: Proxied (orange cloud)
TTL: Auto
```

### 3. Cloudflare SSL/TLS Settings
1. Go to SSL/TLS → Overview
2. Set encryption mode to: **"Full (strict)"**
3. Enable "Always Use HTTPS"
4. Enable "HTTP Strict Transport Security (HSTS)"

### 4. Cloudflare Page Rules (Optional)
Create a page rule for better performance:
```
URL: go.monumental-i.com/*
Settings:
- Cache Level: Standard
- Browser Cache TTL: 4 hours
- Edge Cache TTL: 1 month
```

### 5. Verification
After DNS propagation (5-15 minutes):
- ✅ `https://go.monumental-i.com/admin` should work
- ✅ SSL certificate should be valid
- ✅ No security warnings

## Troubleshooting

### If SSL warnings persist:
1. Check Cloudflare SSL/TLS mode is "Full (strict)"
2. Verify DNS records are correct
3. Wait for SSL certificate provisioning (up to 24 hours)

### If domain doesn't resolve:
1. Check DNS propagation: https://dnschecker.org
2. Verify Cloudflare proxy is enabled (orange cloud)
3. Check Firebase Console for domain verification status

## Files Modified
- `firebase.json` - Multi-site hosting configuration
- `.firebaserc` - Hosting targets configuration

## Test URLs
- Firebase URL: `https://go-monumental-i.web.app/admin`
- Custom domain: `https://go.monumental-i.com/admin` (after setup)
