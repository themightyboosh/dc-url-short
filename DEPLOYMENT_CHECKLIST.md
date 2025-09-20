# Moni URL Shortener - Deployment Checklist

## 🎯 Project Overview
- **Project Name**: moni-url-short
- **Domain**: go.monumental-i.com
- **Organization**: monumental-i.com (email-based access)
- **Tech Stack**: Firebase + Cloud Functions v2 + React + Chakra UI

## 📋 Pre-Deployment Checklist

### 1. Firebase Project Setup
- [ ] Create Firebase project named "moni-url-short"
- [ ] Enable Google Analytics (optional)
- [ ] Set up billing account (required for Cloud Functions)

### 2. Firebase Services Configuration
- [ ] **Authentication**: Enable Google sign-in provider
- [ ] **Firestore**: Create database in test mode
- [ ] **Cloud Functions**: Enable Cloud Functions v2
- [ ] **Hosting**: Enable Firebase Hosting

### 3. Firebase Configuration
- [ ] Get Firebase config from Project Settings > General > Your apps
- [ ] Update `apps/admin/env.local` with actual Firebase config values:
  ```env
  VITE_FIREBASE_API_KEY=your_actual_api_key
  VITE_FIREBASE_AUTH_DOMAIN=moni-url-short.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=moni-url-short
  VITE_FIREBASE_STORAGE_BUCKET=moni-url-short.firebasestorage.app
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
  VITE_FIREBASE_APP_ID=your_actual_app_id
  ```

### 4. Service Account Setup
- [ ] Go to Project Settings > Service Accounts
- [ ] Generate new private key
- [ ] Replace `moni-url-short-key.json` with the new key
- [ ] Set environment variable: `GOOGLE_APPLICATION_CREDENTIALS=~/moni-url-short-key.json`

### 5. Environment Variables
- [ ] Update `functions/env.local` with correct project ID
- [ ] Add admin emails: `ADMIN_EMAILS=admin@monumental-i.com,daniel@monumental-i.com`
- [ ] Set allowed origins: `ALLOWED_ORIGINS=https://go.monumental-i.com`

### 6. Custom Domain Setup
- [ ] Go to Firebase Hosting
- [ ] Add custom domain: `go.monumental-i.com`
- [ ] Follow DNS setup instructions
- [ ] Update DNS records at Network Solutions:
  - Add A record pointing to Firebase hosting IP
  - Add CNAME record for www subdomain

### 7. Firestore Security Rules
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Verify rules enforce @monumental-i.com email requirement
- [ ] Test with non-monumental-i.com email (should be denied)

### 8. Testing
- [ ] Test Google authentication with @monumental-i.com email
- [ ] Test link creation and management
- [ ] Test redirect functionality
- [ ] Test analytics and click tracking
- [ ] Test API endpoints with proper authentication

## 🚀 Deployment Commands

### Initial Setup
```bash
# Run setup script
./setup-deployment.sh

# Install dependencies
npm install
cd apps/admin && npm install
cd ../functions && npm install
cd ../..
```

### Deploy to Firebase
```bash
# Deploy everything
./deploy.sh

# Or deploy individually
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### Verify Deployment
```bash
# Check functions logs
firebase functions:log

# Test API endpoints
curl https://us-central1-moni-url-short.cloudfunctions.net/api/api/v1/health

# Test redirect
curl -I https://go.monumental-i.com/s/test-slug
```

## 🔐 Security Configuration

### Authentication
- ✅ Google sign-in only
- ✅ Organization email validation (@monumental-i.com)
- ✅ Client-side and server-side validation

### Firestore Rules
- ✅ Only @monumental-i.com users can read/write links
- ✅ Only Cloud Functions can write clicks
- ✅ Public redirect resolution through functions

### CORS Configuration
- ✅ Restricted to go.monumental-i.com domain
- ✅ Proper headers for security

## 📊 Post-Deployment Verification

### Admin Panel
- [ ] Access https://go.monumental-i.com/admin
- [ ] Login with @monumental-i.com email
- [ ] Create a test link
- [ ] Verify analytics dashboard works

### API Endpoints
- [ ] Test health endpoint: `/api/v1/health`
- [ ] Test link creation: `POST /api/v1/links`
- [ ] Test link listing: `GET /api/v1/links`
- [ ] Test click logs: `GET /api/v1/links/{slug}/clicks`

### Redirect System
- [ ] Create test link with custom slug
- [ ] Test redirect: `https://go.monumental-i.com/s/{slug}`
- [ ] Verify click tracking works
- [ ] Check analytics dashboard for click data

## 🆘 Troubleshooting

### Common Issues
1. **Authentication fails**: Check Firebase config values
2. **CORS errors**: Verify ALLOWED_ORIGINS environment variable
3. **Permission denied**: Check Firestore rules and service account
4. **Domain not working**: Verify DNS records and Firebase hosting config

### Debug Commands
```bash
# Check Firebase project
firebase projects:list

# Check current project
firebase use

# View function logs
firebase functions:log --only api
firebase functions:log --only redirect

# Test locally
firebase emulators:start
```

## 📞 Support
- Firebase Console: https://console.firebase.google.com/
- Firebase Docs: https://firebase.google.com/docs
- Project Repository: https://github.com/themightyboosh/dc-url-short
