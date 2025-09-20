# DNS Records Quick Reference
## go.monumental-i.com Setup

### 📋 Records to Add in Network Solutions

#### 1. A Record (Required)
```
Type: A
Host: go
Points to: [Firebase IP from console]
TTL: 3600
```

#### 2. CNAME Record (Optional - for www)
```
Type: CNAME
Host: www.go
Points to: go.monumental-i.com
TTL: 3600
```

#### 3. TXT Record (Required for verification)
```
Type: TXT
Host: go
Value: [TXT value from Firebase console]
TTL: 3600
```

### 🔍 Verification Commands
```bash
# Check A record
dig go.monumental-i.com A

# Check CNAME record
dig www.go.monumental-i.com CNAME

# Check TXT record
dig go.monumental-i.com TXT

# Test domain
curl -I https://go.monumental-i.com
```

### ⏱️ Timeline
- **DNS Changes**: Immediate
- **Propagation**: 1-4 hours
- **Firebase Verification**: Automatic
- **SSL Certificate**: Automatic (up to 24 hours)

### 🎯 End Result
- `go.monumental-i.com` → Your URL shortener
- `www.go.monumental-i.com` → Redirects to main domain
- SSL certificate automatically provisioned
- Organization-based admin access
