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
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
exports.createLink = createLink;
exports.listLinks = listLinks;
exports.getLink = getLink;
exports.updateLink = updateLink;
exports.deleteLink = deleteLink;
exports.getClickLogs = getClickLogs;
exports.healthCheck = healthCheck;
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const types_1 = require("../types");
const utils_1 = require("../utils");
// Get Firestore instance
const getDb = () => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    return admin.firestore();
};
// Middleware to verify admin access
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json((0, utils_1.createApiResponse)(false, null, 'Authentication required'));
    }
    // Check if user is from monumental-i.com organization
    const userEmail = req.user.email;
    if (!userEmail || !userEmail.endsWith('@monumental-i.com')) {
        return res.status(403).json((0, utils_1.createApiResponse)(false, null, 'Access restricted to monumental-i.com organization'));
    }
    return next();
}
// Reserved slugs that cannot be used
const RESERVED_SLUGS = [
    'admin', 'api', 'assets', 'static', 'test', 'debug', 'health', 'status',
    'www', 'mail', 'ftp', 'blog', 'shop', 'store', 'support', 'help',
    'about', 'contact', 'privacy', 'terms', 'login', 'signup', 'signin',
    'dashboard', 'profile', 'settings', 'account', 'billing', 'pricing',
    'docs', 'documentation', 'api-docs', 'swagger', 'openapi'
];
// POST /api/v1/links - Create link
async function createLink(req, res) {
    try {
        const validatedData = types_1.CreateLinkSchema.parse(req.body);
        // Generate slug if not provided
        let slug = validatedData.slug || (0, utils_1.generateSlug)();
        // Check if slug is reserved
        if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
            return res.status(400).json((0, utils_1.createApiResponse)(false, null, 'Slug is reserved and cannot be used'));
        }
        // Check if slug already exists
        const existing = await getDb().collection('links').doc(slug).get();
        if (existing.exists) {
            // If slug exists, update the existing link with new URL
            const existingData = existing.data();
            const linkData = Object.assign(Object.assign({}, validatedData), { slug, longUrl: (0, utils_1.sanitizeUrl)(validatedData.longUrl), createdAt: (existingData === null || existingData === void 0 ? void 0 : existingData.createdAt) || admin.firestore.FieldValue.serverTimestamp(), clickCount: (existingData === null || existingData === void 0 ? void 0 : existingData.clickCount) || 0, lastClickedAt: (existingData === null || existingData === void 0 ? void 0 : existingData.lastClickedAt) || null, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
            await getDb().collection('links').doc(slug).set(linkData, { merge: true });
            return res.status(200).json((0, utils_1.createApiResponse)(true, linkData, undefined, 'Link updated successfully'));
        }
        const linkData = Object.assign(Object.assign({}, validatedData), { slug, longUrl: (0, utils_1.sanitizeUrl)(validatedData.longUrl), createdAt: admin.firestore.FieldValue.serverTimestamp(), clickCount: 0, lastClickedAt: null });
        await getDb().collection('links').doc(slug).set(linkData);
        return res.status(201).json((0, utils_1.createApiResponse)(true, linkData, undefined, 'Link created successfully'));
    }
    catch (error) {
        console.error('Error creating link:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json((0, utils_1.createApiResponse)(false, null, 'Invalid input data', error.errors[0].message));
        }
        return res.status(500).json((0, utils_1.createApiResponse)(false, null, 'Internal server error'));
    }
}
// GET /api/v1/links - List links with pagination
async function listLinks(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search;
        let query = getDb().collection('links').orderBy('createdAt', 'desc');
        if (search) {
            // Simple search by slug or longUrl containing search term
            query = query.where('slug', '>=', search).where('slug', '<=', search + '\uf8ff');
        }
        const snapshot = await query.limit(limit).offset(offset).get();
        const totalSnapshot = await getDb().collection('links').get();
        const links = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        const response = {
            success: true,
            data: links,
            pagination: {
                limit,
                offset,
                total: totalSnapshot.size,
                hasMore: snapshot.size === limit
            }
        };
        return res.json(response);
    }
    catch (error) {
        console.error('Error listing links:', error);
        return res.status(500).json((0, utils_1.createApiResponse)(false, null, 'Internal server error'));
    }
}
// GET /api/v1/links/:slug - Get specific link
async function getLink(req, res) {
    try {
        const { slug } = req.params;
        if (!(0, utils_1.isValidSlug)(slug)) {
            return res.status(400).json((0, utils_1.createApiResponse)(false, null, 'Invalid slug format'));
        }
        const doc = await getDb().collection('links').doc(slug).get();
        if (!doc.exists) {
            return res.status(404).json((0, utils_1.createApiResponse)(false, null, 'Link not found'));
        }
        return res.json((0, utils_1.createApiResponse)(true, Object.assign({ id: doc.id }, doc.data())));
    }
    catch (error) {
        console.error('Error getting link:', error);
        return res.status(500).json((0, utils_1.createApiResponse)(false, null, 'Internal server error'));
    }
}
// PATCH /api/v1/links/:slug - Update link
async function updateLink(req, res) {
    try {
        const { slug } = req.params;
        const validatedData = types_1.UpdateLinkSchema.parse(req.body);
        if (!(0, utils_1.isValidSlug)(slug)) {
            return res.status(400).json((0, utils_1.createApiResponse)(false, null, 'Invalid slug format'));
        }
        const docRef = getDb().collection('links').doc(slug);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json((0, utils_1.createApiResponse)(false, null, 'Link not found'));
        }
        const updateData = Object.assign({}, validatedData);
        if (updateData.longUrl) {
            updateData.longUrl = (0, utils_1.sanitizeUrl)(updateData.longUrl);
        }
        await docRef.update(updateData);
        const updatedDoc = await docRef.get();
        return res.json((0, utils_1.createApiResponse)(true, Object.assign({ id: updatedDoc.id }, updatedDoc.data()), undefined, 'Link updated successfully'));
    }
    catch (error) {
        console.error('Error updating link:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json((0, utils_1.createApiResponse)(false, null, 'Invalid input data', error.errors[0].message));
        }
        return res.status(500).json((0, utils_1.createApiResponse)(false, null, 'Internal server error'));
    }
}
// DELETE /api/v1/links/:slug - Delete link
async function deleteLink(req, res) {
    try {
        const { slug } = req.params;
        if (!(0, utils_1.isValidSlug)(slug)) {
            return res.status(400).json((0, utils_1.createApiResponse)(false, null, 'Invalid slug format'));
        }
        const docRef = getDb().collection('links').doc(slug);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json((0, utils_1.createApiResponse)(false, null, 'Link not found'));
        }
        await docRef.delete();
        return res.json((0, utils_1.createApiResponse)(true, undefined, undefined, 'Link deleted successfully'));
    }
    catch (error) {
        console.error('Error deleting link:', error);
        return res.status(500).json((0, utils_1.createApiResponse)(false, null, 'Internal server error'));
    }
}
// GET /api/v1/links/:slug/clicks - Get click logs
async function getClickLogs(req, res) {
    try {
        const { slug } = req.params;
        const from = req.query.from;
        const to = req.query.to;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        if (!(0, utils_1.isValidSlug)(slug)) {
            return res.status(400).json((0, utils_1.createApiResponse)(false, null, 'Invalid slug format'));
        }
        let query = getDb().collection('clicks')
            .where('slug', '==', slug)
            .orderBy('ts', 'desc');
        if (from) {
            query = query.where('ts', '>=', new Date(from));
        }
        if (to) {
            query = query.where('ts', '<=', new Date(to));
        }
        const snapshot = await query.limit(limit).offset(offset).get();
        const clicks = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return res.json((0, utils_1.createApiResponse)(true, clicks));
    }
    catch (error) {
        console.error('Error getting click logs:', error);
        return res.status(500).json((0, utils_1.createApiResponse)(false, null, 'Internal server error'));
    }
}
// GET /api/v1/health - Health check
async function healthCheck(req, res) {
    return res.json((0, utils_1.createApiResponse)(true, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    }));
}
//# sourceMappingURL=index.js.map