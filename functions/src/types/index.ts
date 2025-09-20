import { Request } from 'express';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

// Link data model
export const LinkSchema = z.object({
  slug: z.string().min(1).max(50),
  longUrl: z.string().url(),
  createdAt: z.instanceof(Timestamp),
  createdBy: z.string().email(),
  disabled: z.boolean().default(false),
  clickCount: z.number().default(0),
  lastClickedAt: z.instanceof(Timestamp).nullable().default(null),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  emailAlerts: z.boolean().default(false),
  updatedAt: z.instanceof(Timestamp).optional()
});

export const CreateLinkSchema = LinkSchema.omit({
  createdAt: true,
  clickCount: true,
  lastClickedAt: true
});

export const UpdateLinkSchema = LinkSchema.partial().omit({
  slug: true,
  createdAt: true,
  createdBy: true
});

// Click data model
export const ClickSchema = z.object({
  slug: z.string(),
  ts: z.instanceof(Timestamp),
  ip: z.string(),
  userAgent: z.string(),
  referer: z.string().nullable(),
  hostname: z.string().nullable(),
  country: z.string().nullable(),
  region: z.string().nullable(),
  city: z.string().nullable(),
  timezone: z.string().nullable(),
  isp: z.string().nullable()
});

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// Request types
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}

export interface ClickLogRequest extends Request {
  body: {
    slug: string;
    ip: string;
    userAgent: string;
    referer?: string;
    hostname?: string;
  };
}
