import axios from 'axios'
import { auth } from './firebase'

const API_BASE_URL = 'https://us-central1-moni-url-short.cloudfunctions.net/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add cache-busting for development and multi-window scenarios
api.interceptors.request.use((config) => {
  // Add timestamp to prevent caching in multi-window scenarios
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: Date.now(),
      _v: '1.0.0' // Version for cache busting
    }
  }
  return config
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser
  if (user) {
    return await user.getIdToken()
  }
  return null
}

export interface Link {
  id: string
  slug: string
  longUrl: string
  createdAt: string
  createdBy: string
  disabled: boolean
  clickCount: number
  lastClickedAt: string | null
  notes?: string
  tags?: string[]
  emailAlerts?: boolean
}

export interface Click {
  id: string
  slug: string
  ts: string
  ip: string
  userAgent: string
  referer: string | null
  hostname: string | null
  country: string | null
  region: string | null
  city: string | null
  timezone: string | null
  isp: string | null
}

export interface CreateLinkData {
  slug?: string
  longUrl: string
  createdBy: string
  disabled?: boolean
  notes?: string
  tags?: string[]
  emailAlerts?: boolean
}

export interface UpdateLinkData {
  longUrl?: string
  disabled?: boolean
  notes?: string
  tags?: string[]
  emailAlerts?: boolean
}

export interface Settings {
  globalEmailAlerts: boolean
}

export const settingsApi = {
  get: async (): Promise<Settings> => {
    const response = await api.get('/api/v1/settings')
    return response.data.data
  },
  update: async (data: Partial<Settings>): Promise<Settings> => {
    const response = await api.patch('/api/v1/settings', data)
    return response.data.data
  }
}

export const linksApi = {
  create: async (data: CreateLinkData): Promise<Link> => {
    const response = await api.post('/api/v1/links', data)
    return response.data.data
  },

  list: async (params?: { limit?: number; offset?: number; search?: string }): Promise<{
    data: Link[]
    pagination: {
      limit: number
      offset: number
      total: number
      hasMore: boolean
    }
  }> => {
    const response = await api.get('/api/v1/links', { params })
    return response.data
  },

  get: async (slug: string): Promise<Link> => {
    const response = await api.get(`/api/v1/links/${slug}`)
    return response.data.data
  },

  update: async (slug: string, data: UpdateLinkData): Promise<Link> => {
    const response = await api.patch(`/api/v1/links/${slug}`, data)
    return response.data.data
  },

  delete: async (slug: string): Promise<void> => {
    await api.delete(`/api/v1/links/${slug}`)
  },

  getClicks: async (slug: string, params?: {
    from?: string
    to?: string
    limit?: number
    offset?: number
  }): Promise<Click[]> => {
    const response = await api.get(`/api/v1/links/${slug}/clicks`, { params })
    return response.data.data
  },

  clearClicks: async (slug: string): Promise<{ deletedCount: number }> => {
    const response = await api.delete(`/api/v1/links/${slug}/clicks`)
    return response.data.data
  },

  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get('/api/v1/health')
    return response.data.data
  }
}

export default api
