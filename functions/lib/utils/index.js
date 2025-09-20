"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
exports.toKebabCase = toKebabCase;
exports.isValidSlug = isValidSlug;
exports.reverseDnsLookup = reverseDnsLookup;
exports.getClientIp = getClientIp;
exports.sanitizeUrl = sanitizeUrl;
exports.getGeolocation = getGeolocation;
exports.createApiResponse = createApiResponse;
exports.convertTimestamps = convertTimestamps;
const dns_1 = require("dns");
const axios_1 = __importDefault(require("axios"));
const firestore_1 = require("firebase-admin/firestore");
function generateSlug(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function toKebabCase(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
function isValidSlug(slug) {
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 1 && slug.length <= 50;
}
async function reverseDnsLookup(ip) {
    try {
        const hostnames = await dns_1.promises.reverse(ip);
        return hostnames[0] || null;
    }
    catch (error) {
        console.warn(`Reverse DNS lookup failed for IP ${ip}:`, error);
        return null;
    }
}
function getClientIp(req) {
    var _a, _b, _c;
    return (((_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) ||
        req.headers['x-real-ip'] ||
        ((_b = req.connection) === null || _b === void 0 ? void 0 : _b.remoteAddress) ||
        ((_c = req.socket) === null || _c === void 0 ? void 0 : _c.remoteAddress) ||
        req.ip ||
        'unknown');
}
function sanitizeUrl(url) {
    try {
        const urlObj = new URL(url);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            throw new Error('Invalid protocol');
        }
        return urlObj.toString();
    }
    catch (error) {
        throw new Error('Invalid URL format');
    }
}
async function getGeolocation(ip) {
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
        const response = await axios_1.default.get(`https://ipapi.co/${ip}/json/`, {
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
    }
    catch (error) {
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
function isPrivateIP(ip) {
    const privateRanges = [
        /^10\./, // 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
        /^192\.168\./, // 192.168.0.0/16
        /^127\./, // 127.0.0.0/8 (localhost)
        /^169\.254\./, // 169.254.0.0/16 (link-local)
        /^::1$/, // IPv6 localhost
        /^fe80:/, // IPv6 link-local
        /^fc00:/, // IPv6 unique local
        /^fd00:/ // IPv6 unique local
    ];
    return privateRanges.some(range => range.test(ip));
}
function createApiResponse(success, data, error, message) {
    const response = { success };
    if (data !== undefined)
        response.data = data;
    if (error)
        response.error = error;
    if (message)
        response.message = message;
    return response;
}
// Convert Firestore timestamps to JavaScript dates for API responses
function convertTimestamps(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (obj instanceof firestore_1.Timestamp) {
        return obj.toDate().toISOString();
    }
    if (Array.isArray(obj)) {
        return obj.map(convertTimestamps);
    }
    if (typeof obj === 'object') {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertTimestamps(value);
        }
        return converted;
    }
    return obj;
}
//# sourceMappingURL=index.js.map