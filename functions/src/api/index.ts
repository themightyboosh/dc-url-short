import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import { z } from 'zod';
import { 
  LinkSchema, 
  CreateLinkSchema, 
  UpdateLinkSchema, 
  ClickSchema,
  ApiResponse,
  PaginatedResponse,
  AuthenticatedRequest 
} from '../types';
import { 
  generateSlug, 
  isValidSlug, 
  reverseDnsLookup, 
  getClientIp, 
  sanitizeUrl,
  createApiResponse 
} from '../utils';

const db = admin.firestore();

// Middleware to verify admin access
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user) {
    return res.status(401).json(createApiResponse(false, null, 'Authentication required'));
  }

  // Check if user is from monumental-i.com organization
  const userEmail = req.user.email;
  if (!userEmail || !userEmail.endsWith('@monumental-i.com')) {
    return res.status(403).json(createApiResponse(false, null, 'Access restricted to monumental-i.com organization'));
  }

  next();
}

// POST /api/v1/links - Create link
export async function createLink(req: AuthenticatedRequest, res: Response) {
  try {
    const validatedData = CreateLinkSchema.parse(req.body);
    
    // Generate slug if not provided
    let slug = validatedData.slug || generateSlug();
    
    // Ensure slug is unique
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.collection('links').doc(slug).get();
      if (!existing.exists) break;
      slug = generateSlug();
      attempts++;
    }
    
    if (attempts >= 10) {
      return res.status(500).json(createApiResponse(false, null, 'Unable to generate unique slug'));
    }

    const linkData = {
      ...validatedData,
      slug,
      longUrl: sanitizeUrl(validatedData.longUrl),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      clickCount: 0,
      lastClickedAt: null
    };

    await db.collection('links').doc(slug).set(linkData);

    res.status(201).json(createApiResponse(true, linkData, null, 'Link created successfully'));
  } catch (error) {
    console.error('Error creating link:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(false, null, 'Invalid input data', error.errors[0].message));
    }
    res.status(500).json(createApiResponse(false, null, 'Internal server error'));
  }
}

// GET /api/v1/links - List links with pagination
export async function listLinks(req: AuthenticatedRequest, res: Response) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;

    let query = db.collection('links').orderBy('createdAt', 'desc');

    if (search) {
      // Simple search by slug or longUrl containing search term
      query = query.where('slug', '>=', search).where('slug', '<=', search + '\uf8ff');
    }

    const snapshot = await query.limit(limit).offset(offset).get();
    const totalSnapshot = await db.collection('links').get();

    const links = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const response: PaginatedResponse<any> = {
      success: true,
      data: links,
      pagination: {
        limit,
        offset,
        total: totalSnapshot.size,
        hasMore: snapshot.size === limit
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing links:', error);
    res.status(500).json(createApiResponse(false, null, 'Internal server error'));
  }
}

// GET /api/v1/links/:slug - Get specific link
export async function getLink(req: AuthenticatedRequest, res: Response) {
  try {
    const { slug } = req.params;
    
    if (!isValidSlug(slug)) {
      return res.status(400).json(createApiResponse(false, null, 'Invalid slug format'));
    }

    const doc = await db.collection('links').doc(slug).get();
    
    if (!doc.exists) {
      return res.status(404).json(createApiResponse(false, null, 'Link not found'));
    }

    res.json(createApiResponse(true, { id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting link:', error);
    res.status(500).json(createApiResponse(false, null, 'Internal server error'));
  }
}

// PATCH /api/v1/links/:slug - Update link
export async function updateLink(req: AuthenticatedRequest, res: Response) {
  try {
    const { slug } = req.params;
    const validatedData = UpdateLinkSchema.parse(req.body);

    if (!isValidSlug(slug)) {
      return res.status(400).json(createApiResponse(false, null, 'Invalid slug format'));
    }

    const docRef = db.collection('links').doc(slug);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json(createApiResponse(false, null, 'Link not found'));
    }

    const updateData: any = { ...validatedData };
    if (updateData.longUrl) {
      updateData.longUrl = sanitizeUrl(updateData.longUrl);
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    res.json(createApiResponse(true, { id: updatedDoc.id, ...updatedDoc.data() }, null, 'Link updated successfully'));
  } catch (error) {
    console.error('Error updating link:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiResponse(false, null, 'Invalid input data', error.errors[0].message));
    }
    res.status(500).json(createApiResponse(false, null, 'Internal server error'));
  }
}

// DELETE /api/v1/links/:slug - Delete link
export async function deleteLink(req: AuthenticatedRequest, res: Response) {
  try {
    const { slug } = req.params;

    if (!isValidSlug(slug)) {
      return res.status(400).json(createApiResponse(false, null, 'Invalid slug format'));
    }

    const docRef = db.collection('links').doc(slug);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json(createApiResponse(false, null, 'Link not found'));
    }

    await docRef.delete();

    res.json(createApiResponse(true, null, null, 'Link deleted successfully'));
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json(createApiResponse(false, null, 'Internal server error'));
  }
}

// GET /api/v1/links/:slug/clicks - Get click logs
export async function getClickLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { slug } = req.params;
    const from = req.query.from as string;
    const to = req.query.to as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!isValidSlug(slug)) {
      return res.status(400).json(createApiResponse(false, null, 'Invalid slug format'));
    }

    let query = db.collection('clicks')
      .where('slug', '==', slug)
      .orderBy('ts', 'desc');

    if (from) {
      query = query.where('ts', '>=', new Date(from));
    }
    if (to) {
      query = query.where('ts', '<=', new Date(to));
    }

    const snapshot = await query.limit(limit).offset(offset).get();
    const clicks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(createApiResponse(true, clicks));
  } catch (error) {
    console.error('Error getting click logs:', error);
    res.status(500).json(createApiResponse(false, null, 'Internal server error'));
  }
}

// GET /api/v1/health - Health check
export async function healthCheck(req: Request, res: Response) {
  res.json(createApiResponse(true, { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }));
}
