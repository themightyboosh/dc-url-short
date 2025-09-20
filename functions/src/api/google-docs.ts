import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import { z } from 'zod';
import { 
  generateSlug, 
  toKebabCase,
  sanitizeUrl,
  createApiResponse,
  convertTimestamps
} from '../utils';

// Get Firestore instance
const getDb = () => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
};

// Schema for Google Docs webhook
const GoogleDocsWebhookSchema = z.object({
  docUrl: z.string().url(),
  docName: z.string().min(1),
  docId: z.string().optional(),
  customSlug: z.string().optional(),
  createdBy: z.string().email(),
  tags: z.array(z.string()).optional(),
  emailAlerts: z.boolean().optional()
});

// POST /api/v1/google-docs/webhook - Create short link from Google Docs
export async function createShortLinkFromGoogleDocs(req: Request, res: Response) {
  try {
    const validatedData = GoogleDocsWebhookSchema.parse(req.body);
    
    // Generate slug if not provided
    let slug = validatedData.customSlug ? toKebabCase(validatedData.customSlug) : generateSlug();
    
    // If the converted slug is empty, generate a random one
    if (!slug) {
      slug = generateSlug();
    }
    
    // Check if slug already exists
    const existing = await getDb().collection('links').doc(slug).get();
    
    if (existing.exists) {
      // If slug exists, update the existing link with new URL
      const existingData = existing.data();
      const linkData = {
        longUrl: sanitizeUrl(validatedData.docUrl),
        slug,
        createdBy: validatedData.createdBy,
        notes: `Google Doc: ${validatedData.docName}`,
        tags: [...(validatedData.tags || []), 'google-docs', 'auto-generated'],
        emailAlerts: validatedData.emailAlerts || true,
        disabled: false,
        createdAt: existingData?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        clickCount: existingData?.clickCount || 0,
        lastClickedAt: existingData?.lastClickedAt || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await getDb().collection('links').doc(slug).set(linkData, { merge: true });

      // Get the updated document to return with actual timestamps
      const updatedDoc = await getDb().collection('links').doc(slug).get();
      const updatedData = { id: updatedDoc.id, ...updatedDoc.data() };

      return res.status(200).json(createApiResponse(true, convertTimestamps(updatedData), undefined, 'Google Doc link updated successfully'));
    }

    // Create new link
    const linkData = {
      longUrl: sanitizeUrl(validatedData.docUrl),
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
    const createdData = { id: createdDoc.id, ...createdDoc.data() };

    return res.status(201).json(createApiResponse(true, convertTimestamps(createdData), undefined, 'Google Doc short link created successfully'));
    
  } catch (error) {
    console.error('Error creating Google Doc short link:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(false, null, 'Invalid input data', error.errors[0].message));
    }
    return res.status(500).json(createApiResponse(false, null, 'Internal server error'));
  }
}

// GET /api/v1/google-docs/links - List all Google Docs links
export async function listGoogleDocsLinks(req: Request, res: Response) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const query = getDb().collection('links')
      .where('tags', 'array-contains', 'google-docs')
      .orderBy('createdAt', 'desc');

    const snapshot = await query.limit(limit).offset(offset).get();
    const totalSnapshot = await getDb().collection('links')
      .where('tags', 'array-contains', 'google-docs')
      .get();

    const links = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const response = {
      success: true,
      data: convertTimestamps(links),
      pagination: {
        limit,
        offset,
        total: totalSnapshot.size,
        hasMore: snapshot.size === limit
      }
    };

    return res.json(response);
  } catch (error) {
    console.error('Error listing Google Docs links:', error);
    return res.status(500).json(createApiResponse(false, null, 'Internal server error'));
  }
}

// POST /api/v1/google-docs/batch - Create multiple Google Docs links
export async function createBatchGoogleDocsLinks(req: Request, res: Response) {
  try {
    const { docs } = req.body;
    
    if (!Array.isArray(docs)) {
      return res.status(400).json(createApiResponse(false, null, 'docs must be an array'));
    }

    const results = [];
    const errors = [];

    for (const doc of docs) {
      try {
        const validatedData = GoogleDocsWebhookSchema.parse(doc);
        
        // Generate slug
        let slug = validatedData.customSlug ? toKebabCase(validatedData.customSlug) : generateSlug();
        if (!slug) slug = generateSlug();
        
        // Check if slug exists
        const existing = await getDb().collection('links').doc(slug).get();
        
        if (existing.exists) {
          // Update existing
          const linkData = {
            longUrl: sanitizeUrl(validatedData.docUrl),
            slug,
            createdBy: validatedData.createdBy,
            notes: `Google Doc: ${validatedData.docName}`,
            tags: [...(validatedData.tags || []), 'google-docs', 'auto-generated'],
            emailAlerts: validatedData.emailAlerts || true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          await getDb().collection('links').doc(slug).set(linkData, { merge: true });
          results.push({ slug, status: 'updated', url: `https://go.monumental-i.com/${slug}` });
        } else {
          // Create new
          const linkData = {
            longUrl: sanitizeUrl(validatedData.docUrl),
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
        
      } catch (error) {
        errors.push({
          doc: doc.docName || 'Unknown',
          error: (error as Error).message
        });
      }
    }

    return res.json(createApiResponse(true, {
      results,
      errors,
      summary: {
        total: docs.length,
        successful: results.length,
        failed: errors.length
      }
    }));

  } catch (error) {
    console.error('Error creating batch Google Docs links:', error);
    return res.status(500).json(createApiResponse(false, null, 'Internal server error'));
  }
}
