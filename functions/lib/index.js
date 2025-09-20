"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirect = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const api_1 = require("./api");
const utils_1 = require("./utils");
// Initialize Firebase Admin
admin.initializeApp();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: [
        'https://go.monumental-i.com',
        'https://moni-url-short.web.app',
        'https://moni-url-short.firebaseapp.com'
    ],
    credentials: true
}));
app.use(express_1.default.json());
// Authentication middleware
app.use(async (req, res, next) => {
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
    }
    catch (error) {
        console.error('Auth error:', error);
        next(); // Continue without user
    }
});
// API Routes
app.post('/api/v1/links', api_1.requireAdmin, api_1.createLink);
app.get('/api/v1/links', api_1.requireAdmin, api_1.listLinks);
app.get('/api/v1/links/:slug', api_1.requireAdmin, api_1.getLink);
app.patch('/api/v1/links/:slug', api_1.requireAdmin, api_1.updateLink);
app.delete('/api/v1/links/:slug', api_1.requireAdmin, api_1.deleteLink);
app.get('/api/v1/links/:slug/clicks', api_1.requireAdmin, api_1.getClickLogs);
app.get('/api/v1/settings', api_1.requireAdmin, api_1.getSettings);
app.patch('/api/v1/settings', api_1.requireAdmin, api_1.updateSettings);
app.get('/api/v1/health', api_1.healthCheck);
app.get('/api/v1/docs', api_1.getDocumentation);
// Export the Express app as a Cloud Function
exports.api = functions.https.onRequest(app);
// Redirect function for short URLs
exports.redirect = functions.https.onRequest(async (req, res) => {
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
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000));
        const linkDoc = await Promise.race([linkPromise, timeoutPromise]);
        if (!linkDoc.exists) {
            res.status(404).json({ error: 'Short URL not found' });
            return;
        }
        const linkData = linkDoc.data();
        if (linkData === null || linkData === void 0 ? void 0 : linkData.disabled) {
            res.status(404).json({ error: 'Short URL is disabled' });
            return;
        }
        // Validate long URL
        if (!(linkData === null || linkData === void 0 ? void 0 : linkData.longUrl)) {
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
    }
    catch (error) {
        console.error('Redirect error:', error);
        // Graceful degradation - try to redirect to a fallback page
        if (error.message === 'Database timeout') {
            res.status(503).json({
                error: 'Service temporarily unavailable',
                message: 'Please try again in a moment'
            });
        }
        else {
            res.status(500).json({
                error: 'Internal server error',
                message: 'Please try again later'
            });
        }
    }
});
// Async function to log clicks
async function logClick(slug, req) {
    try {
        const ip = (0, utils_1.getClientIp)(req);
        const userAgent = req.headers['user-agent'] || '';
        const referer = req.headers.referer || null;
        // Attempt reverse DNS lookup and geolocation (fire-and-forget)
        const [hostname, geolocation] = await Promise.all([
            (0, utils_1.reverseDnsLookup)(ip),
            (0, utils_1.getGeolocation)(ip)
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
    }
    catch (error) {
        console.error('Click logging error:', error);
    }
}
//# sourceMappingURL=index.js.map