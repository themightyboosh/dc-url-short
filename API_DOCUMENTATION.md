# Monumental Link Manager API Documentation

## Overview

The Monumental Link Manager API is a production-ready URL shortener with click tracking designed for the `monumental-i.com` organization. It provides comprehensive link management, analytics, and Google Chat alert capabilities.

## Base URL

- **Production**: `https://go.monumental-i.com`
- **API Endpoint**: `https://us-central1-moni-url-short.cloudfunctions.net/api`

## Authentication

All API endpoints (except health check and documentation) require Firebase Authentication with a `@monumental-i.com` email address.

### Authentication Header
```
Authorization: Bearer <firebase_id_token>
```

## API Endpoints

### Health Check

#### GET `/api/v1/health`
Returns the health status of the API and all services.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-20T02:45:23.123Z",
    "version": "1.0.0",
    "responseTime": "67ms",
    "services": {
      "database": "healthy",
      "functions": "healthy",
      "hosting": "healthy"
    },
    "uptime": 290.055997867,
    "documentation": {
      "openapi": "https://go.monumental-i.com/openapi.yaml",
      "markdown": "https://go.monumental-i.com/API_DOCUMENTATION.md",
      "admin_panel": "https://go.monumental-i.com/admin/"
    }
  }
}
```

### Link Management

#### POST `/api/v1/links`
Create a new short link.

**Request Body:**
```json
{
  "slug": "my-custom-slug",
  "longUrl": "https://example.com/very-long-url",
  "createdBy": "user@monumental-i.com",
  "disabled": false,
  "notes": "Marketing campaign link",
  "tags": ["marketing", "campaign"],
  "emailAlerts": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "my-custom-slug",
    "slug": "my-custom-slug",
    "longUrl": "https://example.com/very-long-url",
    "createdAt": "2025-09-20T02:45:23.123Z",
    "createdBy": "user@monumental-i.com",
    "disabled": false,
    "clickCount": 0,
    "lastClickedAt": null,
    "notes": "Marketing campaign link",
    "tags": ["marketing", "campaign"],
    "emailAlerts": true
  },
  "message": "Link created successfully"
}
```

#### GET `/api/v1/links`
List all links with pagination.

**Query Parameters:**
- `limit` (optional): Number of links to return (max 100, default 20)
- `offset` (optional): Number of links to skip (default 0)
- `search` (optional): Search term for slug or URL

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "my-custom-slug",
      "slug": "my-custom-slug",
      "longUrl": "https://example.com/very-long-url",
      "createdAt": "2025-09-20T02:45:23.123Z",
      "createdBy": "user@monumental-i.com",
      "disabled": false,
      "clickCount": 42,
      "lastClickedAt": "2025-09-20T02:45:23.123Z",
      "notes": "Marketing campaign link",
      "tags": ["marketing", "campaign"],
      "emailAlerts": true
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### GET `/api/v1/links/{slug}`
Get details for a specific link.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "my-custom-slug",
    "slug": "my-custom-slug",
    "longUrl": "https://example.com/very-long-url",
    "createdAt": "2025-09-20T02:45:23.123Z",
    "createdBy": "user@monumental-i.com",
    "disabled": false,
    "clickCount": 42,
    "lastClickedAt": "2025-09-20T02:45:23.123Z",
    "notes": "Marketing campaign link",
    "tags": ["marketing", "campaign"],
    "emailAlerts": true
  }
}
```

#### PATCH `/api/v1/links/{slug}`
Update an existing link.

**Request Body:**
```json
{
  "longUrl": "https://example.com/updated-url",
  "disabled": false,
  "notes": "Updated notes",
  "tags": ["marketing", "updated"],
  "emailAlerts": false
}
```

#### DELETE `/api/v1/links/{slug}`
Delete a link permanently.

**Response:**
```json
{
  "success": true,
  "message": "Link deleted successfully"
}
```

### Click Analytics

#### GET `/api/v1/links/{slug}/clicks`
Get click logs for a specific link.

**Query Parameters:**
- `from` (optional): Start date (ISO 8601)
- `to` (optional): End date (ISO 8601)
- `limit` (optional): Number of clicks to return (max 200, default 50)
- `offset` (optional): Number of clicks to skip (default 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "click-123",
      "slug": "my-custom-slug",
      "ts": "2025-09-20T02:45:23.123Z",
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "referer": "https://example.com/page",
      "hostname": "example.com",
      "country": "United States",
      "region": "Missouri",
      "city": "Kansas City",
      "timezone": "America/Chicago",
      "isp": "Comcast Cable"
    }
  ]
}
```

#### DELETE `/api/v1/links/{slug}/clicks`
Clear all click logs for a link and reset click count.

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 15
  },
  "message": "Cleared 15 click logs"
}
```

### Global Settings

#### GET `/api/v1/settings`
Get global system settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "globalEmailAlerts": false
  }
}
```

#### PATCH `/api/v1/settings`
Update global system settings.

**Request Body:**
```json
{
  "globalEmailAlerts": true
}
```

### Documentation

#### GET `/api/v1/docs`
Get comprehensive API documentation and endpoint information.

**Response:**
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
        "clicks": "GET /api/v1/links/{slug}/clicks",
        "clearClicks": "DELETE /api/v1/links/{slug}/clicks"
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

## Data Models

### Link Object
```json
{
  "id": "string",
  "slug": "string",
  "longUrl": "string (URI)",
  "createdAt": "string (ISO 8601)",
  "createdBy": "string (email)",
  "disabled": "boolean",
  "clickCount": "integer",
  "lastClickedAt": "string (ISO 8601) | null",
  "notes": "string | null",
  "tags": "string[] | null",
  "emailAlerts": "boolean"
}
```

### Click Object
```json
{
  "id": "string",
  "slug": "string",
  "ts": "string (ISO 8601)",
  "ip": "string",
  "userAgent": "string",
  "referer": "string | null",
  "hostname": "string | null",
  "country": "string | null",
  "region": "string | null",
  "city": "string | null",
  "timezone": "string | null",
  "isp": "string | null"
}
```

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "message": "Optional detailed message"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `500` - Internal Server Error

## Slug Formatting (Kebab-Case)

Custom slugs are automatically converted to kebab-case:
- Special characters are removed
- Spaces become hyphens
- Multiple hyphens are collapsed to single hyphens
- Leading/trailing hyphens are removed

**Examples:**
- `"My Custom Slug!"` → `"my-custom-slug"`
- `"test@#$%slug"` → `"testslug"`
- `"  multiple   spaces  "` → `"multiple-spaces"`

## Google Chat Alerts

When `emailAlerts` is enabled for a link, the system sends rich Google Chat notifications containing:

- Link details (short URL, destination)
- Click information (time, location, IP)
- Creator information
- Professional card formatting

### Alert Recipients
- **Primary**: User who created the link (`createdBy`)
- **Fallback**: `daniel@monumental-i.com`

### Geolocation Data
Click logs include geolocation information from `ipapi.co`:
- Country, region, city
- Timezone
- ISP information

## Rate Limiting

The API implements reasonable rate limiting to prevent abuse:
- No strict limits for authenticated users
- Graceful degradation under high load
- Error isolation for non-critical operations

## Short URL Usage

Short URLs are accessed directly via the domain:
- `https://go.monumental-i.com/{slug}`
- Automatic redirect to the long URL
- Click tracking and analytics
- Google Chat alerts (if enabled)

## Examples

### Creating a Link with cURL
```bash
curl -X POST "https://go.monumental-i.com/api/v1/links" \
  -H "Authorization: Bearer <firebase_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "product-launch",
    "longUrl": "https://example.com/product-launch-page",
    "createdBy": "marketing@monumental-i.com",
    "notes": "Q4 product launch campaign",
    "tags": ["marketing", "product", "q4"],
    "emailAlerts": true
  }'
```

### Getting Click Analytics
```bash
curl -X GET "https://go.monumental-i.com/api/v1/links/product-launch/clicks?limit=10" \
  -H "Authorization: Bearer <firebase_token>"
```

### Testing Health
```bash
curl -X GET "https://go.monumental-i.com/api/v1/health"
```

## Support

For questions or issues:
- **Email**: admin@monumental-i.com
- **Admin Panel**: https://go.monumental-i.com/admin/
- **Health Check**: https://go.monumental-i.com/api/v1/health