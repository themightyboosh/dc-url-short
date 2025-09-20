import { promises as dns } from 'dns';
import axios from 'axios';
import { Timestamp } from 'firebase-admin/firestore';

export function generateSlug(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function toKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 1 && slug.length <= 50;
}

export async function reverseDnsLookup(ip: string): Promise<string | null> {
  try {
    const hostnames = await dns.reverse(ip);
    return hostnames[0] || null;
  } catch (error) {
    console.warn(`Reverse DNS lookup failed for IP ${ip}:`, error);
    return null;
  }
}

export function getClientIp(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol');
    }
    return urlObj.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

export async function getGeolocation(ip: string): Promise<{
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  isp: string | null;
}> {
  try {
    // Skip geolocation for local/private IPs
    if (isPrivateIP(ip)) {
      return {
        country: null,
        region: null,
        city: null,
        timezone: null,
        isp: null
      };
    }

    // Use ipapi.co (free tier: 1000 requests/day)
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Monumental-URL-Shortener/1.0'
      }
    });

    const data = response.data;
    
    return {
      country: data.country_name || null,
      region: data.region || null,
      city: data.city || null,
      timezone: data.timezone || null,
      isp: data.org || null
    };
  } catch (error) {
    console.warn(`Geolocation lookup failed for IP ${ip}:`, error);
    return {
      country: null,
      region: null,
      city: null,
      timezone: null,
      isp: null
    };
  }
}

function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^127\./,                   // 127.0.0.0/8 (localhost)
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^::1$/,                    // IPv6 localhost
    /^fe80:/,                   // IPv6 link-local
    /^fc00:/,                   // IPv6 unique local
    /^fd00:/                    // IPv6 unique local
  ];
  
  return privateRanges.some(range => range.test(ip));
}

export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): { success: boolean; data?: T; error?: string; message?: string } {
  const response: any = { success };
  if (data !== undefined) response.data = data;
  if (error) response.error = error;
  if (message) response.message = message;
  return response;
}

// Convert Firestore timestamps to JavaScript dates for API responses
export function convertTimestamps(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Timestamp) {
    return obj.toDate().toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertTimestamps(value);
    }
    return converted;
  }
  
  return obj;
}
