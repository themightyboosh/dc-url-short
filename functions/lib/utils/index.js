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
exports.generateSlug = generateSlug;
exports.toKebabCase = toKebabCase;
exports.isValidSlug = isValidSlug;
exports.reverseDnsLookup = reverseDnsLookup;
exports.getClientIp = getClientIp;
exports.sanitizeUrl = sanitizeUrl;
exports.getGeolocation = getGeolocation;
exports.createApiResponse = createApiResponse;
exports.convertTimestamps = convertTimestamps;
exports.sendGoogleChatAlert = sendGoogleChatAlert;
exports.sendEmailAlert = sendEmailAlert;
const dns_1 = require("dns");
const axios_1 = __importDefault(require("axios"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const functions = __importStar(require("firebase-functions"));
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
// Google Chat notification functions
async function sendGoogleChatAlert(slug, longUrl, clickData, createdBy) {
    var _a;
    try {
        // Use Google Chat webhook URL from Firebase config
        const webhookUrl = (_a = functions.config().google_chat) === null || _a === void 0 ? void 0 : _a.webhook_url;
        if (!webhookUrl) {
            console.log('Google Chat webhook not configured, skipping notification');
            return;
        }
        const location = [clickData.city, clickData.region, clickData.country]
            .filter(Boolean)
            .join(', ') || 'Unknown';
        const message = {
            text: `🔗 *Link Click Alert*`,
            cards: [{
                    header: {
                        title: `Link Click: ${slug}`,
                        subtitle: `Clicked by someone in ${location}`
                    },
                    sections: [{
                            widgets: [
                                {
                                    textParagraph: {
                                        text: `<b>Short URL:</b> <a href="https://go.monumental-i.com/${slug}">https://go.monumental-i.com/${slug}</a>`
                                    }
                                },
                                {
                                    textParagraph: {
                                        text: `<b>Destination:</b> <a href="${longUrl}">${longUrl}</a>`
                                    }
                                },
                                {
                                    textParagraph: {
                                        text: `<b>Time:</b> ${clickData.timestamp}`
                                    }
                                },
                                {
                                    textParagraph: {
                                        text: `<b>Location:</b> ${location}`
                                    }
                                },
                                {
                                    textParagraph: {
                                        text: `<b>IP:</b> ${clickData.ip}`
                                    }
                                },
                                {
                                    textParagraph: {
                                        text: `<b>Referer:</b> ${clickData.referer || 'Direct'}`
                                    }
                                },
                                {
                                    textParagraph: {
                                        text: `<b>Created by:</b> ${createdBy}`
                                    }
                                }
                            ]
                        }]
                }]
        };
        await axios_1.default.post(webhookUrl, message, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        console.log(`Google Chat alert sent for link: ${slug} to space: ${webhookUrl}`);
    }
    catch (error) {
        console.error('Failed to send Google Chat alert:', error);
        // Fallback to email if Chat fails
        await sendEmailAlert(slug, longUrl, clickData, createdBy);
    }
}
// Email fallback notification function
async function sendEmailAlert(slug, longUrl, clickData, createdBy) {
    try {
        // Send to the user who created the link, fallback to daniel@monumental-i.com
        const recipientEmail = createdBy || 'daniel@monumental-i.com';
        // Create email transporter (using Gmail SMTP)
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'daniel@monumental-i.com',
                pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD
            }
        });
        const location = [clickData.city, clickData.region, clickData.country]
            .filter(Boolean)
            .join(', ') || 'Unknown';
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">🔗 Link Click Alert</h2>
        <p>A short link has been clicked:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Link Details</h3>
          <p><strong>Short URL:</strong> <a href="https://go.monumental-i.com/${slug}">https://go.monumental-i.com/${slug}</a></p>
          <p><strong>Destination:</strong> <a href="${longUrl}">${longUrl}</a></p>
          <p><strong>Created by:</strong> ${createdBy}</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Click Information</h3>
          <p><strong>Time:</strong> ${clickData.timestamp}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>IP Address:</strong> ${clickData.ip}</p>
          <p><strong>Referer:</strong> ${clickData.referer || 'Direct'}</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This alert was sent because email notifications are enabled for this link.
        </p>
      </div>
    `;
        const mailOptions = {
            from: process.env.EMAIL_USER || 'daniel@monumental-i.com',
            to: recipientEmail,
            subject: `🔗 Link Click: ${slug} - ${location}`,
            html: emailHtml
        };
        await transporter.sendMail(mailOptions);
        console.log(`Email alert sent to ${recipientEmail} for link: ${slug}`);
    }
    catch (error) {
        console.error('Failed to send email alert:', error);
        // Don't throw error - email failure shouldn't break the redirect
    }
}
//# sourceMappingURL=index.js.map