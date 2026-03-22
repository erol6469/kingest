// ═══════════════════════════════════════════════════════════════
//  KINGEST — Client-side Security Utilities
//  PIN hashing, secure storage, input sanitization
// ═══════════════════════════════════════════════════════════════
import { SECURITY } from './config.js';

// SHA-256 hash using Web Crypto API (available in WebView)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hash PIN before sending to server or storing
export async function hashPin(pin) {
    if (!pin || pin.length < 4) throw new Error('PIN must be at least 4 digits');
    // Double hash: once client-side, once server-side
    const clientHash = await sha256(pin.toString() + '_kingest_salt');
    return clientHash;
}

// Secure storage — uses iOS Keychain via bridge if available,
// falls back to sessionStorage (never localStorage for sensitive data)
const secureStore = {
    set(key, value) {
        // Try iOS Keychain bridge first
        if (window.webkit?.messageHandlers?.kingestKeychain) {
            window.webkit.messageHandlers.kingestKeychain.postMessage({
                action: 'set', key, value: typeof value === 'string' ? value : JSON.stringify(value)
            });
            return;
        }
        // Fallback: sessionStorage (cleared when app closes)
        try { sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); }
        catch (e) { console.warn('[SECURITY] Storage failed:', e.message); }
    },
    get(key) {
        try { return sessionStorage.getItem(key); }
        catch { return null; }
    },
    remove(key) {
        try { sessionStorage.removeItem(key); }
        catch {}
    }
};

// Auth token management
export function setAuthToken(token) {
    secureStore.set(SECURITY.TOKEN_KEY, token);
}

export function getAuthToken() {
    return secureStore.get(SECURITY.TOKEN_KEY);
}

export function clearAuth() {
    secureStore.remove(SECURITY.TOKEN_KEY);
    secureStore.remove(SECURITY.PIN_HASH_KEY);
}

// PIN attempt tracking (anti brute-force)
let pinAttempts = 0;
let lockoutUntil = 0;

export function checkPinLockout() {
    if (lockoutUntil > Date.now()) {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 60000);
        return { locked: true, minutesRemaining: remaining };
    }
    return { locked: false };
}

export function recordPinAttempt(success) {
    if (success) {
        pinAttempts = 0;
        lockoutUntil = 0;
        return;
    }
    pinAttempts++;
    if (pinAttempts >= SECURITY.MAX_PIN_ATTEMPTS) {
        lockoutUntil = Date.now() + SECURITY.LOCKOUT_DURATION_MS;
        pinAttempts = 0;
    }
}

// Sanitize user input
export function sanitizeInput(str, maxLength = 255) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength)
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
}

// Validate email format
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate IBAN format
export function isValidIBAN(iban) {
    return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{13,30}$/.test((iban || '').toUpperCase().replace(/\s/g, ''));
}

// Validate card number (Luhn algorithm)
export function isValidCardNumber(num) {
    const digits = (num || '').replace(/\s/g, '');
    if (!/^[0-9]{13,19}$/.test(digits)) return false;
    let sum = 0;
    for (let i = digits.length - 1; i >= 0; i--) {
        let d = parseInt(digits[i]);
        if ((digits.length - 1 - i) % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
    }
    return sum % 10 === 0;
}

export default { hashPin, setAuthToken, getAuthToken, clearAuth, sanitizeInput, isValidEmail, isValidIBAN, isValidCardNumber, checkPinLockout, recordPinAttempt };

