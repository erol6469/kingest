// ═══════════════════════════════════════════════════════════════
//  KINGEST — JWT Authentication Middleware
// ═══════════════════════════════════════════════════════════════
const crypto = require('crypto');

// JWT Secret — MUST be set via environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRY_SECONDS = 3600; // 1 hour

// Simple JWT implementation (no external dependency)
function base64UrlEncode(str) {
    return Buffer.from(str).toString('base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Buffer.from(str, 'base64').toString();
}

function createToken(payload) {
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const body = base64UrlEncode(JSON.stringify({
        ...payload,
        iat: now,
        exp: now + JWT_EXPIRY_SECONDS,
    }));
    const signature = crypto.createHmac('sha256', JWT_SECRET)
        .update(header + '.' + body).digest('base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return header + '.' + body + '.' + signature;
}

function verifyToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET)
        .update(header + '.' + body).digest('base64')
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    if (signature !== expectedSig) return null;
    
    try {
        const payload = JSON.parse(base64UrlDecode(body));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch { return null; }
}

// PIN hashing with salt
function hashPin(pin, salt) {
    if (!salt) salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(pin.toString(), salt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt };
}

function verifyPin(pin, hash, salt) {
    const result = hashPin(pin, salt);
    return result.hash === hash;
}

// Express middleware — protects payment routes
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ ok: false, error: 'Authentication required' });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
    }
    
    req.user = payload;
    next();
}

// Optional auth — doesn't block, but attaches user if present
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const payload = verifyToken(authHeader.substring(7));
        if (payload) req.user = payload;
    }
    next();
}

module.exports = {
    createToken,
    verifyToken,
    hashPin,
    verifyPin,
    authMiddleware,
    optionalAuth,
    JWT_SECRET,
};

