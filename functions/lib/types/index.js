"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickSchema = exports.UpdateLinkSchema = exports.CreateLinkSchema = exports.LinkSchema = void 0;
const zod_1 = require("zod");
// Link data model
exports.LinkSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1).max(50),
    longUrl: zod_1.z.string().url(),
    createdAt: zod_1.z.date(),
    createdBy: zod_1.z.string().email(),
    disabled: zod_1.z.boolean().default(false),
    clickCount: zod_1.z.number().default(0),
    lastClickedAt: zod_1.z.date().nullable().default(null),
    notes: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    emailAlerts: zod_1.z.boolean().default(false),
    updatedAt: zod_1.z.date().optional()
});
exports.CreateLinkSchema = exports.LinkSchema.omit({
    createdAt: true,
    clickCount: true,
    lastClickedAt: true
});
exports.UpdateLinkSchema = exports.LinkSchema.partial().omit({
    slug: true,
    createdAt: true,
    createdBy: true
});
// Click data model
exports.ClickSchema = zod_1.z.object({
    slug: zod_1.z.string(),
    ts: zod_1.z.date(),
    ip: zod_1.z.string(),
    userAgent: zod_1.z.string(),
    referer: zod_1.z.string().nullable(),
    hostname: zod_1.z.string().nullable(),
    country: zod_1.z.string().nullable(),
    region: zod_1.z.string().nullable(),
    city: zod_1.z.string().nullable(),
    timezone: zod_1.z.string().nullable(),
    isp: zod_1.z.string().nullable()
});
//# sourceMappingURL=index.js.map