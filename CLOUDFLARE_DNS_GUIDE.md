# Cloudflare DNS Setup - Step by Step

## ✅ YES - Use PROXIED (Orange Cloud)

**Always select PROXIED** for these benefits:
- 🔒 SSL/TLS encryption
- 🛡️ DDoS protection  
- ⚡ CDN performance
- 🔄 Firebase compatibility

## 📋 Exact DNS Configuration

### In Cloudflare Dashboard:
1. Go to **DNS** → **Records**
2. Click **Add record**
3. Configure exactly like this:

```
Type: CNAME
Name: go
Target: go-monumental-i.web.app
Proxy status: PROXIED (orange cloud) ✅
TTL: Auto
```

## 🔍 Google Verification Issue Explained

**Why Google asks to delete non-existent records:**
1. **Previous setup**: You might have old DNS records from earlier attempts
2. **Conflict detection**: Google checks for any conflicting records
3. **Normal behavior**: This is standard Firebase domain verification

**What to do:**
1. **Ignore the delete request** - proceed with CNAME setup
2. **Add the CNAME record** as shown above
3. **Wait for propagation** (5-15 minutes)
4. **Test the domain**: `https://go.monumental-i.com/admin`

## 🚨 Common Issues & Solutions

### If verification fails:
1. **Check existing records**: Look for any old `go` records
2. **Delete conflicting records**: Remove any old A/CNAME records for `go`
3. **Wait for propagation**: DNS changes take time
4. **Try again**: Re-add the CNAME record

### If SSL warnings persist:
1. **Cloudflare SSL/TLS**: Set to "Full (strict)"
2. **Always Use HTTPS**: Enable this setting
3. **Wait 24 hours**: SSL certificates can take time to provision

## 🧪 Testing Steps

After DNS propagation:
1. Test: `https://go.monumental-i.com/admin`
2. Check SSL: Should show valid certificate
3. Test auth: Firebase login should work without CORS errors

## 📞 Need Help?

If you're still having issues:
1. Check DNS propagation: https://dnschecker.org
2. Verify Cloudflare proxy is enabled (orange cloud)
3. Check Firebase Console for domain status
