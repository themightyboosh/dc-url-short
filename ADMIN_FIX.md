# Admin Interface Fix - Firebase Hosting Configuration

## Problem
The admin interface at `go.monumental-i.com/admin` was experiencing intermittent "Not found" errors due to conflicting Firebase hosting rewrite rules.

## Root Cause
The Firebase hosting configuration had conflicting rewrite rules:
- `/admin/**` → `/index.html` (for admin SPA)
- `!**/*.*` → `redirect` function (too broad, caught admin routes)

## Solution
Updated `firebase.json` with specific, non-conflicting rewrite rules:

```json
{
  "rewrites": [
    {
      "source": "/api/**",
      "function": "api"
    },
    {
      "source": "/admin/**", 
      "destination": "/index.html"
    },
    {
      "source": "/[a-zA-Z0-9-_]+",
      "function": "redirect"
    }
  ]
}
```

## How It Works
1. **API Routes** (`/api/**`): Handled by the `api` function
2. **Admin Routes** (`/admin/**`): Served the SPA `index.html` for client-side routing
3. **Short Links** (`/[slug]`): Only alphanumeric slugs with hyphens/underscores go to redirect function

## Deployment
- **Build**: `./build-admin.sh` (builds admin interface)
- **Deploy**: `firebase deploy --only hosting` (requires authentication)
- **Alternative**: `./deploy-admin.sh` (for separate domain deployment)

## Files Modified
- `firebase.json` - Fixed rewrite rules
- `build-admin.sh` - Build script
- `deploy-admin.sh` - Separate domain deployment script
- `firebase-admin.json` - Separate Firebase config for admin-only deployment

## Testing
After deployment, the admin interface should be consistently available at:
- `https://go.monumental-i.com/admin`
- `https://go.monumental-i.com/admin/dashboard`
- `https://go.monumental-i.com/admin/links`

The intermittent "Not found" errors should be resolved.
