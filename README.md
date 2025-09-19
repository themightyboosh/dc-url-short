# DC URL Shortener

A simple and efficient URL shortener service.

## Features

- Shorten long URLs into compact, shareable links
- Custom alias support
- Analytics and click tracking
- RESTful API
- Modern web interface

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
npm install
# or
pnpm install
```

### Development

```bash
npm run dev
# or
pnpm dev
```

## API Endpoints

- `POST /api/shorten` - Create a short URL
- `GET /:shortCode` - Redirect to original URL
- `GET /api/analytics/:shortCode` - Get analytics data

## License

MIT
