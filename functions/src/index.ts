import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { 
  createLink, 
  listLinks, 
  getLink, 
  updateLink, 
  deleteLink, 
  getClickLogs, 
  healthCheck,
  requireAdmin 
} from './api';
import { 
  reverseDnsLookup, 
  getClientIp 
} from './utils';

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://go.monumental-i.com'],
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
app.get('/api/v1/health', healthCheck);

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);

// Redirect function for short URLs
export const redirect = functions.https.onRequest(async (req, res) => {
  try {
    const slug = req.path.split('/s/')[1];
    
    if (!slug) {
      return res.status(404).json({ error: 'Not found' });
    }

    const db = admin.firestore();
    const linkDoc = await db.collection('links').doc(slug).get();

    if (!linkDoc.exists) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const linkData = linkDoc.data();
    
    if (linkData?.disabled) {
      return res.status(404).json({ error: 'Short URL is disabled' });
    }

    // Fire-and-forget click logging
    logClick(slug, req).catch(error => {
      console.error('Click logging failed:', error);
    });

    // Update click count and last clicked timestamp
    db.collection('links').doc(slug).update({
      clickCount: admin.firestore.FieldValue.increment(1),
      lastClickedAt: admin.firestore.FieldValue.serverTimestamp()
    }).catch(error => {
      console.error('Click count update failed:', error);
    });

    // Redirect to the long URL
    res.redirect(302, linkData.longUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Async function to log clicks
async function logClick(slug: string, req: any) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers.referer || null;
    
    // Attempt reverse DNS lookup (fire-and-forget)
    const hostname = await reverseDnsLookup(ip);

    const clickData = {
      slug,
      ts: admin.firestore.FieldValue.serverTimestamp(),
      ip,
      userAgent,
      referer,
      hostname,
      country: null // Reserved for future geolocation
    };

    await admin.firestore().collection('clicks').add(clickData);
  } catch (error) {
    console.error('Click logging error:', error);
  }
}
