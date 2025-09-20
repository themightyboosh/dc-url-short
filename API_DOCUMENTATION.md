# Monumental Link Manager API Documentation

## Overview
The Monumental Link Manager provides a comprehensive API for creating, managing, and tracking short URLs. This service is designed for internal use within the Monumental organization and integrates with Google authentication.

## Base URL
- **Production**: `https://go.monumental-i.com`
- **Admin Panel**: `https://go.monumental-i.com/admin/`

## Authentication
All API endpoints require Google authentication with `@monumental-i.com` email addresses.

### Headers Required
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

## API Endpoints

### 1. Create Short Link
**POST** `/api/v1/links`

Creates a new short link with optional email alerts.

#### Request Body
```json
{
  "slug": "custom-slug",           // Optional: Custom slug (auto-generated if not provided)
  "longUrl": "https://example.com", // Required: Original URL to shorten
  "createdBy": "user@monumental-i.com", // Required: Creator's email
  "notes": "Optional notes",      // Optional: Description/notes
  "tags": ["tag1", "tag2"],       // Optional: Array of tags
  "emailAlerts": false            // Optional: Enable email alerts (default: false)
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "slug": "custom-slug",
    "longUrl": "https://example.com",
    "createdAt": "2025-09-19T23:44:22.000Z",
    "createdBy": "user@monumental-i.com",
    "disabled": false,
    "clickCount": 0,
    "lastClickedAt": null,
    "notes": "Optional notes",
    "tags": ["tag1", "tag2"],
    "emailAlerts": false
  },
  "message": "Link created successfully"
}
```

### 2. List Links
**GET** `/api/v1/links`

Retrieves a paginated list of short links.

#### Query Parameters
- `limit`: Number of links per page (default: 20, max: 100)
- `offset`: Number of links to skip (default: 0)
- `search`: Search term for slug or longUrl (optional)

#### Example
```
GET /api/v1/links?limit=10&offset=0&search=example
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "slug": "example-link",
      "longUrl": "https://example.com",
      "createdAt": "2025-09-19T23:44:22.000Z",
      "createdBy": "user@monumental-i.com",
      "disabled": false,
      "clickCount": 15,
      "lastClickedAt": "2025-09-19T23:50:00.000Z",
      "notes": "Example link",
      "tags": ["example"],
      "emailAlerts": true
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25,
    "hasMore": true
  }
}
```

### 3. Get Link Details
**GET** `/api/v1/links/{slug}`

Retrieves details for a specific short link.

#### Response
```json
{
  "success": true,
  "data": {
    "slug": "example-link",
    "longUrl": "https://example.com",
    "createdAt": "2025-09-19T23:44:22.000Z",
    "createdBy": "user@monumental-i.com",
    "disabled": false,
    "clickCount": 15,
    "lastClickedAt": "2025-09-19T23:50:00.000Z",
    "notes": "Example link",
    "tags": ["example"],
    "emailAlerts": true
  }
}
```

### 4. Update Link
**PATCH** `/api/v1/links/{slug}`

Updates an existing short link.

#### Request Body
```json
{
  "longUrl": "https://new-example.com", // Optional: New URL
  "disabled": false,                    // Optional: Enable/disable link
  "notes": "Updated notes",            // Optional: New notes
  "tags": ["new-tag"],                 // Optional: New tags
  "emailAlerts": true                  // Optional: Enable/disable email alerts
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "slug": "example-link",
    "longUrl": "https://new-example.com",
    "createdAt": "2025-09-19T23:44:22.000Z",
    "createdBy": "user@monumental-i.com",
    "disabled": false,
    "clickCount": 15,
    "lastClickedAt": "2025-09-19T23:50:00.000Z",
    "notes": "Updated notes",
    "tags": ["new-tag"],
    "emailAlerts": true
  },
  "message": "Link updated successfully"
}
```

### 5. Delete Link
**DELETE** `/api/v1/links/{slug}`

Deletes a short link permanently.

#### Response
```json
{
  "success": true,
  "message": "Link deleted successfully"
}
```

### 6. Get Click Analytics
**GET** `/api/v1/links/{slug}/clicks`

Retrieves click analytics for a specific short link.

#### Query Parameters
- `from`: Start date (ISO 8601 format)
- `to`: End date (ISO 8601 format)
- `limit`: Number of clicks to return (default: 100)
- `offset`: Number of clicks to skip (default: 0)

#### Example
```
GET /api/v1/links/example-link/clicks?from=2025-09-19T00:00:00.000Z&to=2025-09-19T23:59:59.999Z&limit=50
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "click-id-1",
      "slug": "example-link",
      "ts": "2025-09-19T23:50:00.000Z",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "referer": "https://google.com",
      "hostname": "example.com",
      "country": "United States",
      "region": "California",
      "city": "San Francisco",
      "timezone": "America/Los_Angeles",
      "isp": "Google LLC"
    }
  ]
}
```

### 7. Health Check
**GET** `/api/v1/health`

Checks API health status and provides documentation links.

#### Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-19T23:44:22.000Z",
    "version": "1.0.0",
    "documentation": {
      "openapi": "https://go.monumental-i.com/openapi.yaml",
      "markdown": "https://go.monumental-i.com/API_DOCUMENTATION.md",
      "admin_panel": "https://go.monumental-i.com/admin/"
    }
  }
}
```

### 8. API Documentation
**GET** `/api/v1/docs`

Returns comprehensive API documentation and endpoint information.

#### Response
```json
{
  "success": true,
  "data": {
    "title": "Monumental Link Manager API",
    "version": "1.0.0",
    "description": "Production URL shortener with click tracking for monumental-i.com organization",
    "baseUrl": "https://go.monumental-i.com",
    "authentication": {
      "type": "Firebase Auth",
      "required": true,
      "organization": "@monumental-i.com"
    },
    "documentation": {
      "openapi": "https://go.monumental-i.com/openapi.yaml",
      "markdown": "https://go.monumental-i.com/API_DOCUMENTATION.md",
      "admin_panel": "https://go.monumental-i.com/admin/"
    },
    "endpoints": {
      "links": {
        "create": "POST /api/v1/links",
        "list": "GET /api/v1/links",
        "get": "GET /api/v1/links/{slug}",
        "update": "PATCH /api/v1/links/{slug}",
        "delete": "DELETE /api/v1/links/{slug}",
        "clicks": "GET /api/v1/links/{slug}/clicks"
      },
      "settings": {
        "get": "GET /api/v1/settings",
        "update": "PATCH /api/v1/settings"
      },
      "system": {
        "health": "GET /api/v1/health",
        "docs": "GET /api/v1/docs"
      }
    }
  }
}
```

### 9. Get Global Settings
**GET** `/api/v1/settings`

Retrieves global system settings. Requires authentication with @monumental-i.com email.

#### Response
```json
{
  "success": true,
  "data": {
    "globalEmailAlerts": false
  }
}
```

### 10. Update Global Settings
**PATCH** `/api/v1/settings`

Updates global system settings. Requires authentication with @monumental-i.com email.

#### Request Body
```json
{
  "globalEmailAlerts": true
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "globalEmailAlerts": true
  },
  "message": "Settings updated successfully"
}
```

## Geolocation Analytics

### IP Geolocation
The URL shortener automatically geolocates click data using IP addresses to provide detailed analytics:

- **Country**: Full country name (e.g., "United States")
- **Region**: State/province/region (e.g., "California") 
- **City**: City name (e.g., "San Francisco")
- **Timezone**: Timezone identifier (e.g., "America/Los_Angeles")
- **ISP**: Internet Service Provider (e.g., "Google LLC")

### Privacy & Performance
- Private/local IPs (192.168.x.x, 10.x.x.x, etc.) are not geolocated
- Geolocation lookup is performed asynchronously to avoid slowing redirects
- Uses ipapi.co service (free tier: 1000 requests/day)
- Failed geolocation lookups don't affect link functionality

### Analytics Display
The admin panel displays geolocation data in the click analytics table:
- Location column shows Country, Region, City hierarchy
- ISP column shows Internet Service Provider
- Unknown locations are clearly marked

## Short URL Usage

### Redirect Behavior
Short URLs follow the pattern: `https://go.monumental-i.com/{slug}`

When accessed, they:
1. Log the click (if emailAlerts is enabled, sends notification)
2. Increment click count
3. Update last clicked timestamp
4. Redirect to the original URL

### Slug Formatting (Kebab-Case)
All custom slugs are automatically converted to kebab-case format:
- **Lowercase**: All letters are converted to lowercase
- **Hyphens**: Spaces and special characters are replaced with hyphens
- **Clean**: Multiple consecutive hyphens are collapsed to single hyphens
- **Trimmed**: Leading and trailing hyphens are removed

#### Examples:
- `"My Custom Slug!"` → `"my-custom-slug"`
- `"Marketing Campaign 2024"` → `"marketing-campaign-2024"`
- `"API_Documentation"` → `"api-documentation"`
- `"test@#$%slug"` → `"testslug"`

If the converted slug is empty or invalid, a random slug will be generated automatically.

### Reserved Slugs
The following slugs are reserved and cannot be used:
- `admin`, `api`, `assets`, `static`, `test`, `debug`, `health`, `status`
- `www`, `mail`, `ftp`, `blog`, `shop`, `store`, `support`, `help`
- `about`, `contact`, `privacy`, `terms`, `login`, `signup`, `signin`
- `dashboard`, `profile`, `settings`, `account`, `billing`, `pricing`
- `docs`, `documentation`, `api-docs`, `swagger`, `openapi`

## Email Alerts Feature

### How It Works
When `emailAlerts` is enabled for a link:
1. Each click triggers an email notification
2. Email is sent to Google authorized users (`@monumental-i.com`)
3. Notification includes click details (timestamp, IP, user agent, etc.)

### Integration with Google Chat
Email alerts can be configured to send to Google Chat spaces for real-time notifications.

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Please authenticate with Google"
}
```

```json
{
  "success": false,
  "error": "Access restricted to monumental-i.com organization",
  "message": "Only @monumental-i.com emails are allowed"
}
```

```json
{
  "success": false,
  "error": "Slug is reserved and cannot be used",
  "message": "Please choose a different slug"
}
```

## Rate Limiting
- API calls are limited to prevent abuse
- No specific rate limits documented (contact admin for details)

## Integration Examples

### JavaScript/Node.js
```javascript
const createShortLink = async (longUrl, customSlug = null, emailAlerts = false) => {
  const token = await getFirebaseIdToken(); // Get Firebase ID token
  
  const response = await fetch('https://go.monumental-i.com/api/v1/links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      slug: customSlug,
      longUrl: longUrl,
      createdBy: 'user@monumental-i.com',
      emailAlerts: emailAlerts
    })
  });
  
  return await response.json();
};
```

### Python
```python
import requests
import firebase_admin
from firebase_admin import auth

def create_short_link(long_url, custom_slug=None, email_alerts=False):
    # Get Firebase ID token
    token = get_firebase_id_token()
    
    response = requests.post(
        'https://go.monumental-i.com/api/v1/links',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        },
        json={
            'slug': custom_slug,
            'longUrl': long_url,
            'createdBy': 'user@monumental-i.com',
            'emailAlerts': email_alerts
        }
    )
    
    return response.json()
```

## Security Notes
- All API endpoints require authentication
- Only `@monumental-i.com` email addresses are authorized
- Short URLs are publicly accessible (for redirects)
- Admin panel requires Google authentication
- Firestore security rules enforce organization access

## Support
For technical support or questions about the API, contact the development team at Monumental.
