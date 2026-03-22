// ═══════════════════════════════════════════════════════════════
//  KINGEST — Configuration centralisée
//  Toutes les URLs et paramètres d'environnement ici
// ═══════════════════════════════════════════════════════════════

const ENV = {
  // 'development' | 'staging' | 'production'
  MODE: import.meta.env?.MODE || 'production',
};

// API Base URL — configurable par environnement
// En production : HTTPS obligatoire vers le vrai domaine
// En dev : permet le HTTP local
// In iOS WKWebView, all requests go through the native bridge (Swift)
// so API_BASE is only used as fallback for direct fetch() calls
const API_BASES = {
  development: 'http://192.168.1.58:3001',
  staging: 'https://staging-api.kingest.app',
  production: 'https://kingest-api.onrender.com',
};

export const API_BASE = API_BASES[ENV.MODE] || API_BASES.production;

// PayPal — bascule sandbox/production
const PAYPAL_CONFIGS = {
  development: {
    clientId: import.meta.env?.VITE_PAYPAL_CLIENT_ID || 'AbYsGS1HRqpGbJ4Sgp1d51Ed8R9NwUC58N6T-GPcOTF0kTHHGS9w2fda750phfl0S5mZzSgEboxeI7qa',
    baseUrl: 'https://api-m.sandbox.paypal.com',
    sdkUrl: 'https://www.sandbox.paypal.com/sdk/js',
  },
  production: {
    clientId: import.meta.env?.VITE_PAYPAL_CLIENT_ID || '',
    baseUrl: 'https://api-m.paypal.com',
    sdkUrl: 'https://www.paypal.com/sdk/js',
  },
};

export const PAYPAL_CONFIG = PAYPAL_CONFIGS[ENV.MODE] || PAYPAL_CONFIGS.production;

// Google Pay — bascule test/production
export const GOOGLE_PAY_CONFIG = {
  environment: ENV.MODE === 'production' ? 'PRODUCTION' : 'TEST',
  merchantId: import.meta.env?.VITE_GPAY_MERCHANT_ID || 'BCR2DN4T7KINGEST',
  merchantName: 'Kingest by Gestia',
  gateway: 'stripe',
  gatewayMerchantId: import.meta.env?.VITE_STRIPE_PK || '',
};

// Sécurité
export const SECURITY = {
  TOKEN_KEY: '__kingest_auth_token',
  PIN_HASH_KEY: '__kingest_pin_hash',
  MAX_PIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
};

// Réseau
export const NETWORK = {
  TIMEOUT_MS: 15000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
};

export default { API_BASE, ENV, PAYPAL_CONFIG, GOOGLE_PAY_CONFIG, SECURITY, NETWORK };

