import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { 
  createLink, 
  listLinks, 
  getLink, 
  updateLink, 
  deleteLink, 
  getClickLogs, 
  getSettings,
  updateSettings,
  healthCheck,
  getDocumentation,
  requireAdmin 
} from './api';
import { 
  reverseDnsLookup, 
  getClientIp,
  getGeolocation
} from './utils';

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://go.monumental-i.com',
    'https://moni-url-short.web.app',
    'https://moni-url-short.firebaseapp.com'
  ],
  
  credentials: true
}));
app.use(express.json());

// Authentication middleware
app.use(async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user for public endpoints
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    next(); // Continue without user
  }
});

// API Routes
app.post('/api/v1/links', requireAdmin, createLink);
app.get('/api/v1/links', requireAdmin, listLinks);
app.get('/api/v1/links/:slug', requireAdmin, getLink);
app.patch('/api/v1/links/:slug', requireAdmin, updateLink);
app.delete('/api/v1/links/:slug', requireAdmin, deleteLink);
app.get('/api/v1/links/:slug/clicks', requireAdmin, getClickLogs);
app.get('/api/v1/settings', requireAdmin, getSettings);
app.patch('/api/v1/settings', requireAdmin, updateSettings);
app.get('/api/v1/health', healthCheck);
app.get('/api/v1/docs', getDocumentation);

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);

// Redirect function for short URLs
export const redirect = functions.https.onRequest(async (req, res) => {
  try {
    const path = req.path;
    
    // Skip admin routes, API routes, and static files
    if (path.startsWith('/admin') || 
        path.startsWith('/api') || 
        path.startsWith('/assets') ||
        path.startsWith('/static') ||
        path.includes('.')) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    
    // Extract slug from path (remove leading slash)
    const slug = path.substring(1);
    
    if (!slug) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug) || slug.length > 50) {
      res.status(404).json({ error: 'Invalid short URL' });
      return;
    }

    const db = admin.firestore();
    
    // Add timeout protection
    const linkPromise = db.collection('links').doc(slug).get();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    );
    
    const linkDoc = await Promise.race([linkPromise, timeoutPromise]) as any;

    if (!linkDoc.exists) {
      res.status(404).json({ error: 'Short URL not found' });
      return;
    }

    const linkData = linkDoc.data();
    
    if (linkData?.disabled) {
      res.status(404).json({ error: 'Short URL is disabled' });
      return;
    }

    // Validate long URL
    if (!linkData?.longUrl) {
      res.status(500).json({ error: 'Invalid link configuration' });
      return;
    }

    // Fire-and-forget click logging with error isolation
    logClick(slug, req).catch(error => {
      console.error('Click logging failed (non-critical):', error);
      // Don't fail the redirect for logging errors
    });

    // Update click count with error isolation
    db.collection('links').doc(slug).update({
      clickCount: admin.firestore.FieldValue.increment(1),
      lastClickedAt: admin.firestore.FieldValue.serverTimestamp()
    }).catch(error => {
      console.error('Click count update failed (non-critical):', error);
      // Don't fail the redirect for count update errors
    });

    // Redirect to the long URL
    res.redirect(302, linkData.longUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    
    // Graceful degradation - try to redirect to a fallback page
    if ((error as Error).message === 'Database timeout') {
      res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: 'Please try again in a moment'
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Please try again later'
      });
    }
  }
});

// Async function to log clicks
async function logClick(slug: string, req: any) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers.referer || null;
    
    // Attempt reverse DNS lookup and geolocation (fire-and-forget)
    const [hostname, geolocation] = await Promise.all([
      reverseDnsLookup(ip),
      getGeolocation(ip)
    ]);

    const clickData = {
      slug,
      ts: admin.firestore.FieldValue.serverTimestamp(),
      ip,
      userAgent,
      referer,
      hostname,
      country: geolocation.country,
      region: geolocation.region,
      city: geolocation.city,
      timezone: geolocation.timezone,
      isp: geolocation.isp
    };

    await admin.firestore().collection('clicks').add(clickData);
  } catch (error) {
    console.error('Click logging error:', error);
  }
}
