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
exports.createShortLinkFromGoogleDocs = createShortLinkFromGoogleDocs;
exports.listGoogleDocsLinks = listGoogleDocsLinks;
exports.createBatchGoogleDocsLinks = createBatchGoogleDocsLinks;
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const utils_1 = require("../utils");
// Get Firestore instance
const getDb = () => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    return admin.firestore();
};
// Schema for Google Docs webhook
const GoogleDocsWebhookSchema = zod_1.z.object({
    docUrl: zod_1.z.string().url(),
    docName: zod_1.z.string().min(1),
    docId: zod_1.z.string().optional(),
    customSlug: zod_1.z.string().optional(),
    createdBy: zod_1.z.string().email(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    emailAlerts: zod_1.z.boolean().optional()
});
// POST /api/v1/google-docs/webhook - Create short link from Google Docs
async function createShortLinkFromGoogleDocs(req, res) {
    try {
        const validatedData = GoogleDocsWebhookSchema.parse(req.body);
        // Generate slug if not provided
        let slug = validatedData.customSlug ? (0, utils_1.toKebabCase)(validatedData.customSlug) : (0, utils_1.generateSlug)();
        // If the converted slug is empty, generate a random one
        if (!slug) {
            slug = (0, utils_1.generateSlug)();
        }
        // Check if slug already exists
        const existing = await getDb().collection('links').doc(slug).get();
        if (existing.exists) {
            // If slug exists, update the existing link with new URL
            const existingData = existing.data();
            const linkData = {
                longUrl: (0, utils_1.sanitizeUrl)(validatedData.docUrl),
                slug,
                createdBy: validatedData.createdBy,
                notes: `Google Doc: ${validatedData.docName}`,
                tags: [...(validatedData.tags || []), 'google-docs', 'auto-generated'],
                emailAlerts: validatedData.emailAlerts || true,
                disabled: false,
                createdAt: (existingData === null || existingData === void 0 ? void 0 : existingData.createdAt) || admin.firestore.FieldValue.serverTimestamp(),
                clickCount: (existingData === null || existingData === void 0 ? void 0 : existingData.clickCount) || 0,
                lastClickedAt: (existingData === null || existingData === void 0 ? void 0 : existingData.lastClickedAt) || null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await getDb().collection('links').doc(slug).set(linkData, { merge: true });
            // Get the updated document to return with actual timestamps
            const updatedDoc = await getDb().collection('links').doc(slug).get();
            const updatedData = Object.assign({ id: updatedDoc.id }, updatedDoc.data());
            return res.status(200).json((0, utils_1.createApiResponse)(true, (0, utils_1.convertTimestamps)(updatedData), undefined, 'Google Doc link updated successfully'));
        }
        // Create new link
        const linkData = {
            longUrl: (0, utils_1.sanitizeUrl)(validatedData.docUrl),
            slug,
            createdBy: validatedData.createdBy,
            notes: `Google Doc: ${validatedData.docName}`,
            tags: [...(validatedData.tags || []), 'google-docs', 'auto-generated'],
            emailAlerts: validatedData.emailAlerts || true,
            disabled: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            clickCount: 0,
            lastClickedAt: null
        };
        await getDb().collection('links').doc(slug).set(linkData);
        // Get the created document to return with actual timestamps
        const createdDoc = await getDb().collection('links').doc(slug).get();
        const createdData = Object.assign({ id: createdDoc.id }, createdDoc.data());
        return res.status(201).json((0, utils_1.createApiResponse)(true, (0, utils_1.convertTimestamps)(createdData), undefined, 'Google Doc short link created successfully'));
    }
    catch (error) {
        console.error('Error creating Google Doc short link:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json((0, utils_1.createApiResponse)(false, null, 'Invalid input data', error.errors[0].message));
        }
        return res.status(500).json((0, utils_1.createApiResponse)(false, null, 'Internal server error'));
    }
}
// GET /api/v1/google-docs/links - List all Google Docs links
async function listGoogleDocsLinks(req, res) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = parseInt(req.query.offset) || 0;
        const query = getDb().collection('links')
            .where('tags', 'array-contains', 'google-docs')
            .orderBy('createdAt', 'desc');
        const snapshot = await query.limit(limit).offset(offset).get();
        const totalSnapshot = await getDb().collection('links')
            .where('tags', 'array-contains', 'google-docs')
            .get();
        const links = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        const response = {
            success: true,
            data: (0, utils_1.convertTimestamps)(links),
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
        console.error('Error listing Google Docs links:', error);
        return res.status(500).json((0, utils_1.createApiResponse)(false, null, 'Internal server error'));
    }
}
// POST /api/v1/google-docs/batch - Create multiple Google Docs links
async function createBatchGoogleDocsLinks(req, res) {
    try {
        const { docs } = req.body;
        if (!Array.isArray(docs)) {
            return res.status(400).json((0, utils_1.createApiResponse)(false, null, 'docs must be an array'));
        }
        const results = [];
        const errors = [];
        for (const doc of docs) {
            try {
                const validatedData = GoogleDocsWebhookSchema.parse(doc);
                // Generate slug
                let slug = validatedData.customSlug ? (0, utils_1.toKebabCase)(validatedData.customSlug) : (0, utils_1.generateSlug)();
                if (!slug)
                    slug = (0, utils_1.generateSlug)();
                // Check if slug exists
                const existing = await getDb().collection('links').doc(slug).get();
                if (existing.exists) {
                    // Update existing
                    const linkData = {
                        longUrl: (0, utils_1.sanitizeUrl)(validatedData.docUrl),
                        slug,
                        createdBy: validatedData.createdBy,
                        notes: `Google Doc: ${validatedData.docName}`,
                        tags: [...(validatedData.tags || []), 'google-docs', 'auto-generated'],
                        emailAlerts: validatedData.emailAlerts || true,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    };
                    await getDb().collection('links').doc(slug).set(linkData, { merge: true });
                    results.push({ slug, status: 'updated', url: `https://go.monumental-i.com/${slug}` });
                }
                else {
                    // Create new
                    const linkData = {
                        longUrl: (0, utils_1.sanitizeUrl)(validatedData.docUrl),
                        slug,
                        createdBy: validatedData.createdBy,
                        notes: `Google Doc: ${validatedData.docName}`,
                        tags: [...(validatedData.tags || []), 'google-docs', 'auto-generated'],
                        emailAlerts: validatedData.emailAlerts || true,
                        disabled: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        clickCount: 0,
                        lastClickedAt: null
                    };
                    await getDb().collection('links').doc(slug).set(linkData);
                    results.push({ slug, status: 'created', url: `https://go.monumental-i.com/${slug}` });
                }
            }
            catch (error) {
                errors.push({
                    doc: doc.docName || 'Unknown',
                    error: error.message
                });
            }
        }
        return res.json((0, utils_1.createApiResponse)(true, {
            results,
            errors,
            summary: {
                total: docs.length,
                successful: results.length,
                failed: errors.length
            }
        }));
    }
    catch (error) {
        console.error('Error creating batch Google Docs links:', error);
        return res.status(500).json((0, utils_1.createApiResponse)(false, null, 'Internal server error'));
    }
}
//# sourceMappingURL=google-docs.js.map