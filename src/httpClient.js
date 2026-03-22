// ═══════════════════════════════════════════════════════════════
//  KINGEST — HTTP Client with retry, timeout, error handling
// ═══════════════════════════════════════════════════════════════
import { API_BASE, NETWORK } from './config.js';
import { getAuthToken } from './security.js';

class NetworkError extends Error {
    constructor(message, code, retryable = false) {
        super(message);
        this.name = 'NetworkError';
        this.code = code;
        this.retryable = retryable;
    }
}

// User-friendly error messages
const ERROR_MESSAGES = {
    TIMEOUT: 'La connexion a expiré. Vérifiez votre connexion internet.',
    NETWORK: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
    AUTH: 'Session expirée. Veuillez vous reconnecter.',
    SERVER: 'Erreur serveur. Réessayez dans quelques instants.',
    RATE_LIMIT: 'Trop de requêtes. Attendez quelques minutes.',
    UNKNOWN: 'Une erreur inattendue est survenue.',
};

function getErrorMessage(status, error) {
    if (!status && error?.name === 'AbortError') return ERROR_MESSAGES.TIMEOUT;
    if (!status) return ERROR_MESSAGES.NETWORK;
    if (status === 401) return ERROR_MESSAGES.AUTH;
    if (status === 429) return ERROR_MESSAGES.RATE_LIMIT;
    if (status >= 500) return ERROR_MESSAGES.SERVER;
    return error?.message || ERROR_MESSAGES.UNKNOWN;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function apiFetch(endpoint, options = {}) {
    const {
        method = 'GET',
        body = null,
        timeout = NETWORK.TIMEOUT_MS,
        maxRetries = NETWORK.MAX_RETRIES,
        retryDelay = NETWORK.RETRY_DELAY_MS,
        auth = true,
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (auth) {
                const token = getAuthToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;
            }

            const fetchOptions = {
                method,
                headers,
                signal: controller.signal,
            };
            if (body && method !== 'GET') {
                fetchOptions.body = JSON.stringify(body);
            }

            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            if (response.status === 401) {
                throw new NetworkError(ERROR_MESSAGES.AUTH, 401, false);
            }
            if (response.status === 429) {
                throw new NetworkError(ERROR_MESSAGES.RATE_LIMIT, 429, true);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new NetworkError(
                    data?.error || getErrorMessage(response.status),
                    response.status,
                    response.status >= 500
                );
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;

            // Don't retry non-retryable errors
            if (error instanceof NetworkError && !error.retryable) throw error;
            if (error.name === 'AbortError') {
                lastError = new NetworkError(ERROR_MESSAGES.TIMEOUT, 0, true);
            }

            // Retry with exponential backoff
            if (attempt < maxRetries) {
                const delay = retryDelay * Math.pow(2, attempt);
                console.warn(`[KINGEST] Retry ${attempt + 1}/${maxRetries} in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }

    throw lastError || new NetworkError(ERROR_MESSAGES.UNKNOWN, 0, false);
}

// Convenience methods
export const api = {
    get: (endpoint, opts) => apiFetch(endpoint, { ...opts, method: 'GET' }),
    post: (endpoint, body, opts) => apiFetch(endpoint, { ...opts, method: 'POST', body }),
    put: (endpoint, body, opts) => apiFetch(endpoint, { ...opts, method: 'PUT', body }),
    delete: (endpoint, opts) => apiFetch(endpoint, { ...opts, method: 'DELETE' }),
};

export default api;

