# Network Solutions DNS Configuration Checklist
## Setting up go.monumental-i.com for Firebase Hosting

### 🎯 Goal
Configure `go.monumental-i.com` to point to Firebase Hosting for the URL shortener service.

### 📋 Pre-Deployment Steps

#### 1. Firebase Hosting Setup (Do First)
- [ ] Deploy your Firebase project: `./deploy.sh`
- [ ] Go to Firebase Console → Hosting
- [ ] Click "Add custom domain"
- [ ] Enter domain: `go.monumental-i.com`
- [ ] Firebase will provide DNS records to configure

#### 2. Firebase Will Provide These Records
After adding the domain in Firebase Console, you'll get:
- **A Record**: Points to Firebase hosting IP
- **CNAME Record**: For www subdomain (optional)
- **TXT Record**: For domain verification

### 🔧 Network Solutions Configuration Steps

#### Step 1: Access Network Solutions DNS Management
- [ ] Log into your Network Solutions account
- [ ] Navigate to "My Account" → "Domain Names"
- [ ] Find `monumental-i.com` domain
- [ ] Click "Manage" → "DNS Management"

#### Step 2: Add Firebase A Record
- [ ] In DNS Management, find "A Records" section
- [ ] Add new A record:
  - **Host**: `go`
  - **Points to**: `[Firebase IP address from console]`
  - **TTL**: `3600` (or default)
- [ ] Save changes

#### Step 3: Add CNAME Record (Optional)
- [ ] Add CNAME record for www subdomain:
  - **Host**: `www.go`
  - **Points to**: `go.monumental-i.com`
  - **TTL**: `3600` (or default)
- [ ] Save changes

#### Step 4: Add TXT Record for Verification
- [ ] Add TXT record for domain verification:
  - **Host**: `go`
  - **Value**: `[TXT value from Firebase console]`
  - **TTL**: `3600` (or default)
- [ ] Save changes

### 📝 Detailed Network Solutions Instructions

#### Accessing DNS Management
1. **Login**: Go to networksolutions.com and login
2. **Account Dashboard**: Click "My Account" in top right
3. **Domain Management**: Click "Domain Names" from left menu
4. **Select Domain**: Find and click on `monumental-i.com`
5. **DNS Settings**: Click "Manage" → "DNS Management"

#### Adding A Record
1. **Find A Records Section**: Look for "A Records" or "Address Records"
2. **Add New Record**: Click "Add" or "+" button
3. **Configure Record**:
   - **Host/Name**: `go`
   - **IP Address**: `[From Firebase Console]`
   - **TTL**: `3600` seconds (1 hour)
4. **Save**: Click "Save" or "Update"

#### Adding CNAME Record (Optional)
1. **Find CNAME Section**: Look for "CNAME Records" or "Alias Records"
2. **Add New Record**: Click "Add" or "+" button
3. **Configure Record**:
   - **Host/Name**: `www.go`
   - **Points to**: `go.monumental-i.com`
   - **TTL**: `3600` seconds
4. **Save**: Click "Save" or "Update"

#### Adding TXT Record
1. **Find TXT Section**: Look for "TXT Records" or "Text Records"
2. **Add New Record**: Click "Add" or "+" button
3. **Configure Record**:
   - **Host/Name**: `go`
   - **Value**: `[From Firebase Console]`
   - **TTL**: `3600` seconds
4. **Save**: Click "Save" or "Update"

### ⏱️ DNS Propagation Timeline
- **Initial**: Changes saved immediately
- **Propagation**: 15 minutes to 48 hours
- **Typical**: 1-4 hours for most users
- **Verification**: Firebase will verify automatically

### 🔍 Verification Steps

#### 1. Check DNS Propagation
```bash
# Check A record
dig go.monumental-i.com A

# Check CNAME record
dig www.go.monumental-i.com CNAME

# Check TXT record
dig go.monumental-i.com TXT
```

#### 2. Test Domain Access
- [ ] Wait for DNS propagation (1-4 hours)
- [ ] Test: `https://go.monumental-i.com`
- [ ] Should redirect to Firebase hosting
- [ ] Test admin panel: `https://go.monumental-i.com/admin`

#### 3. Firebase Console Verification
- [ ] Go back to Firebase Console → Hosting
- [ ] Check domain status (should show "Connected")
- [ ] SSL certificate should be automatically provisioned

### 🚨 Troubleshooting

#### Common Issues
1. **Domain not resolving**: Wait longer for DNS propagation
2. **SSL certificate issues**: Firebase handles this automatically
3. **CNAME conflicts**: Remove any existing CNAME records for `go`
4. **A record conflicts**: Remove any existing A records for `go`

#### Network Solutions Specific Issues
1. **Can't find DNS Management**: Look for "Advanced DNS" or "DNS Settings"
2. **Record not saving**: Check for typos in host names
3. **TTL too high**: Set to 3600 seconds for faster propagation

#### Verification Commands
```bash
# Test domain resolution
nslookup go.monumental-i.com

# Test HTTPS
curl -I https://go.monumental-i.com

# Test specific endpoint
curl -I https://go.monumental-i.com/admin
```

### 📞 Support Contacts
- **Network Solutions**: 1-888-642-9675
- **Firebase Support**: https://firebase.google.com/support
- **DNS Propagation Checker**: https://dnschecker.org/

### ✅ Final Checklist
- [ ] Firebase project deployed
- [ ] Custom domain added in Firebase Console
- [ ] A record added in Network Solutions
- [ ] CNAME record added (optional)
- [ ] TXT record added for verification
- [ ] DNS propagation completed (1-4 hours)
- [ ] Domain verified in Firebase Console
- [ ] SSL certificate provisioned
- [ ] Website accessible at https://go.monumental-i.com
- [ ] Admin panel accessible at https://go.monumental-i.com/admin

### 🎯 Expected Results
After completion:
- `go.monumental-i.com` → Firebase Hosting
- `www.go.monumental-i.com` → Redirects to `go.monumental-i.com`
- SSL certificate automatically provisioned
- URL shortener accessible at custom domain
- Admin panel accessible with organization authentication
