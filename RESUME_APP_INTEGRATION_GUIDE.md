# URL Shortener API Integration Guide for Resume App

## 🎯 Overview

This guide shows how to integrate the Monumental URL Shortener API into your resume app. The API allows you to create short links, track clicks, and manage your professional links.

**API Base URL**: `https://us-central1-moni-url-short.cloudfunctions.net/api`  
**Custom Domain**: `https://go.monumental-i.com` (if DNS is configured)  
**Authentication**: Firebase Auth with Google Sign-In (requires @monumental-i.com email)

## 📋 Prerequisites

- Node.js project (React, Vue, Angular, or vanilla JS)
- Firebase SDK installed
- Google account with @monumental-i.com email address
- Internet connection for API calls

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install firebase
# or
yarn add firebase
```

### 2. Firebase Configuration

Create a file `firebase-config.js`:

```javascript
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCUw3U0kNZ35SWL2Z-L0hpfJex4-xcn31I",
  authDomain: "moni-url-short.firebaseapp.com",
  projectId: "moni-url-short",
  storageBucket: "moni-url-short.firebasestorage.app",
  messagingSenderId: "460112494644",
  appId: "1:460112494644:web:6a8045f7c74202e62fca61"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export default app
```

### 3. URL Shortener API Class

Create `url-shortener-api.js`:

```javascript
import { auth } from './firebase-config'

export class URLShortenerAPI {
  constructor() {
    this.baseURL = 'https://us-central1-moni-url-short.cloudfunctions.net/api'
  }

  async getAuthToken() {
    const user = auth.currentUser
    if (user) {
      return await user.getIdToken()
    }
    return null
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    
    // Check if user has correct email domain
    if (!result.user.email?.endsWith('@monumental-i.com')) {
      throw new Error('Access restricted to monumental-i.com organization')
    }
    
    return result.user
  }

  async logout() {
    await auth.signOut()
  }

  async isAuthenticated() {
    return auth.currentUser !== null
  }

  async createLink(longUrl, slug = null, options = {}) {
    const token = await this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${this.baseURL}/api/v1/links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        longUrl,
        slug,
        createdBy: auth.currentUser.email,
        notes: options.notes || '',
        tags: options.tags || [],
        emailAlerts: options.emailAlerts || false,
        disabled: options.disabled || false
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    return response.json()
  }

  async getLinks(params = {}) {
    const token = await this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const queryParams = new URLSearchParams()
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.offset) queryParams.append('offset', params.offset)
    if (params.search) queryParams.append('search', params.search)

    const response = await fetch(`${this.baseURL}/api/v1/links?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    return response.json()
  }

  async getLink(slug) {
    const token = await this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${this.baseURL}/api/v1/links/${slug}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    return response.json()
  }

  async updateLink(slug, updates) {
    const token = await this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${this.baseURL}/api/v1/links/${slug}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    return response.json()
  }

  async deleteLink(slug) {
    const token = await this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${this.baseURL}/api/v1/links/${slug}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    return response.json()
  }

  async getClickLogs(slug, params = {}) {
    const token = await this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const queryParams = new URLSearchParams()
    if (params.from) queryParams.append('from', params.from)
    if (params.to) queryParams.append('to', params.to)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.offset) queryParams.append('offset', params.offset)

    const response = await fetch(`${this.baseURL}/api/v1/links/${slug}/clicks?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${response.status} - ${error.message || 'Unknown error'}`)
    }

    return response.json()
  }

  async healthCheck() {
    const response = await fetch(`${this.baseURL}/api/v1/health`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    return response.json()
  }

  async getDocumentation() {
    const response = await fetch(`${this.baseURL}/api/v1/docs`)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    return response.json()
  }
}
```

## 🎨 React Integration Example

### Authentication Hook

Create `useAuth.js`:

```javascript
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase-config'
import { URLShortenerAPI } from './url-shortener-api'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [api] = useState(() => new URLShortenerAPI())

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async () => {
    try {
      const user = await api.loginWithGoogle()
      return user
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }

  return {
    user,
    loading,
    login,
    logout,
    api
  }
}
```

### Link Management Component

Create `LinkManager.jsx`:

```jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

export function LinkManager() {
  const { user, api } = useAuth()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newLink, setNewLink] = useState({ longUrl: '', slug: '' })

  useEffect(() => {
    if (user) {
      loadLinks()
    }
  }, [user])

  const loadLinks = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getLinks()
      setLinks(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createLink = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      
      const result = await api.createLink(
        newLink.longUrl,
        newLink.slug || undefined,
        {
          notes: `Created from resume app`,
          tags: ['resume', 'professional']
        }
      )
      
      setLinks([result.data, ...links])
      setNewLink({ longUrl: '', slug: '' })
      
      // Show success message
      alert(`Short link created: https://go.monumental-i.com/${result.data.slug}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteLink = async (slug) => {
    if (!confirm('Are you sure you want to delete this link?')) return
    
    try {
      await api.deleteLink(slug)
      setLinks(links.filter(link => link.slug !== slug))
    } catch (err) {
      setError(err.message)
    }
  }

  if (!user) {
    return (
      <div className="auth-prompt">
        <h2>URL Shortener</h2>
        <p>Please sign in with your @monumental-i.com Google account to manage links.</p>
        <button onClick={() => api.loginWithGoogle()}>
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <div className="link-manager">
      <h2>Manage Your Links</h2>
      
      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      <form onSubmit={createLink} className="create-link-form">
        <h3>Create New Link</h3>
        <div>
          <label>Long URL:</label>
          <input
            type="url"
            value={newLink.longUrl}
            onChange={(e) => setNewLink({...newLink, longUrl: e.target.value})}
            placeholder="https://your-resume-website.com"
            required
          />
        </div>
        <div>
          <label>Custom Slug (optional):</label>
          <input
            type="text"
            value={newLink.slug}
            onChange={(e) => setNewLink({...newLink, slug: e.target.value})}
            placeholder="resume"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Link'}
        </button>
      </form>

      <div className="links-list">
        <h3>Your Links</h3>
        {loading && <p>Loading...</p>}
        {links.map(link => (
          <div key={link.slug} className="link-item">
            <div className="link-info">
              <strong>Short:</strong> 
              <a href={`https://go.monumental-i.com/${link.slug}`} target="_blank" rel="noopener noreferrer">
                https://go.monumental-i.com/{link.slug}
              </a>
            </div>
            <div className="link-info">
              <strong>Long:</strong> 
              <a href={link.longUrl} target="_blank" rel="noopener noreferrer">
                {link.longUrl}
              </a>
            </div>
            <div className="link-stats">
              <span>Clicks: {link.clickCount}</span>
              <span>Created: {new Date(link.createdAt).toLocaleDateString()}</span>
            </div>
            <button 
              onClick={() => deleteLink(link.slug)}
              className="delete-btn"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Main App Integration

```jsx
import React from 'react'
import { useAuth } from './useAuth'
import { LinkManager } from './LinkManager'

function App() {
  const { user, loading, login, logout } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="app">
      <header>
        <h1>My Resume App</h1>
        {user ? (
          <div className="user-info">
            <span>Welcome, {user.email}</span>
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <button onClick={login}>Sign in with Google</button>
        )}
      </header>
      
      <main>
        <LinkManager />
      </main>
    </div>
  )
}

export default App
```

## 📊 API Endpoints Reference

### Authentication Required Endpoints

All endpoints below require Firebase Auth token in `Authorization: Bearer <token>` header.

#### Links Management

- **POST** `/api/v1/links` - Create a new link
- **GET** `/api/v1/links` - List all links (with pagination)
- **GET** `/api/v1/links/{slug}` - Get specific link details
- **PATCH** `/api/v1/links/{slug}` - Update link
- **DELETE** `/api/v1/links/{slug}` - Delete link

#### Analytics

- **GET** `/api/v1/links/{slug}/clicks` - Get click logs for a link
- **DELETE** `/api/v1/links/{slug}/clicks` - Clear click logs

#### Settings

- **GET** `/api/v1/settings` - Get global settings
- **PATCH** `/api/v1/settings` - Update global settings

### Public Endpoints

- **GET** `/api/v1/health` - Health check (no auth required)
- **GET** `/api/v1/docs` - API documentation (no auth required)

## 🔧 Data Models

### Link Object

```javascript
{
  id: string,
  slug: string,           // Short URL identifier
  longUrl: string,       // Original URL
  createdAt: string,      // ISO timestamp
  createdBy: string,      // User email
  disabled: boolean,      // Whether link is active
  clickCount: number,     // Total clicks
  lastClickedAt: string,  // ISO timestamp of last click
  notes: string,          // Optional notes
  tags: string[],         // Optional tags
  emailAlerts: boolean    // Whether to send email alerts
}
```

### Click Object

```javascript
{
  id: string,
  slug: string,           // Link slug
  ts: string,            // ISO timestamp
  ip: string,            // Client IP
  userAgent: string,     // Browser info
  referer: string,       // Referring page
  hostname: string,      // Reverse DNS lookup
  country: string,       // Geolocation data
  region: string,
  city: string,
  timezone: string,
  isp: string
}
```

## 🎯 Use Cases for Resume App

### 1. Professional Links
```javascript
// Create links for different sections of your resume
await api.createLink('https://github.com/yourusername', 'github')
await api.createLink('https://linkedin.com/in/yourprofile', 'linkedin')
await api.createLink('https://your-portfolio.com', 'portfolio')
```

### 2. Project Showcases
```javascript
// Create links for specific projects
await api.createLink('https://project1-demo.com', 'project1', {
  notes: 'React e-commerce platform',
  tags: ['react', 'ecommerce', 'portfolio']
})
```

### 3. Contact Information
```javascript
// Create contact links
await api.createLink('mailto:your@email.com', 'email')
await api.createLink('tel:+1234567890', 'phone')
```

### 4. Analytics Tracking
```javascript
// Track which links get the most clicks
const clicks = await api.getClickLogs('github')
console.log(`GitHub link clicked ${clicks.data.length} times`)
```

## 🚨 Error Handling

### Common Error Codes

- **401 Unauthorized**: Not authenticated or invalid token
- **403 Forbidden**: User doesn't have @monumental-i.com email
- **404 Not Found**: Link doesn't exist
- **400 Bad Request**: Invalid input data
- **500 Internal Server Error**: Server-side error

### Error Handling Example

```javascript
try {
  const result = await api.createLink('https://example.com')
  console.log('Success:', result.data)
} catch (error) {
  if (error.message.includes('401')) {
    console.log('Please log in first')
  } else if (error.message.includes('403')) {
    console.log('Access denied - need @monumental-i.com email')
  } else {
    console.log('Error:', error.message)
  }
}
```

## 🔒 Security Considerations

1. **Email Domain Restriction**: Only @monumental-i.com emails can access the API
2. **Token Expiration**: Firebase tokens expire after 1 hour
3. **CORS Protection**: API only accepts requests from authorized origins
4. **Input Validation**: All inputs are validated server-side

## 🧪 Testing

### Test Authentication
```javascript
const api = new URLShortenerAPI()

// Test health check (no auth required)
const health = await api.healthCheck()
console.log('API Status:', health.data.status)

// Test login
try {
  await api.loginWithGoogle()
  console.log('Login successful!')
} catch (error) {
  console.log('Login failed:', error.message)
}
```

### Test Link Creation
```javascript
// Create a test link
const result = await api.createLink('https://example.com', 'test-link')
console.log('Created:', result.data)

// Verify the link works
const link = await api.getLink('test-link')
console.log('Retrieved:', link.data)
```

## 📱 Mobile Integration

For mobile apps (React Native, Flutter, etc.), use the same Firebase configuration and API calls. The authentication flow remains the same.

## 🆘 Troubleshooting

### Common Issues

1. **"Not authenticated" error**
   - Solution: Call `loginWithGoogle()` first

2. **"Access restricted" error**
   - Solution: Use @monumental-i.com email address

3. **CORS errors**
   - Solution: Make sure you're using the correct API base URL

4. **Token expired**
   - Solution: Tokens auto-refresh, but you can call `getAuthToken()` again

### Debug Mode

```javascript
// Enable debug logging
const api = new URLShortenerAPI()

// Check authentication status
console.log('Authenticated:', await api.isAuthenticated())

// Check current user
console.log('Current user:', auth.currentUser?.email)
```

## 📞 Support

- **API Documentation**: `https://go.monumental-i.com/api/v1/docs`
- **Health Check**: `https://go.monumental-i.com/api/v1/health`
- **Admin Panel**: `https://go.monumental-i.com/admin/`

## 🎉 Next Steps

1. **Integrate the API** into your resume app
2. **Create professional links** for your portfolio
3. **Track analytics** to see which links perform best
4. **Customize** the UI to match your app's design
5. **Add error handling** for production use

Happy coding! 🚀



