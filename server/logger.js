// ═══════════════════════════════════════════════════════════════
//  KINGEST — Logging System
// ═══════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[LOG_LEVEL] ?? 2;

function formatDate() {
    return new Date().toISOString();
}

function getLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(LOG_DIR, `kingest-${date}.log`);
}

function writeLog(level, message, meta = {}) {
    if (LEVELS[level] > currentLevel) return;
    
    const entry = {
        timestamp: formatDate(),
        level: level.toUpperCase(),
        message,
        ...meta,
    };
    
    const line = JSON.stringify(entry) + '\n';
    
    // Write to file (async, non-blocking)
    fs.appendFile(getLogFile(), line, (err) => {
        if (err) console.error('[LOG] Write failed:', err.message);
    });
    
    // Also console output
    const prefix = `[${entry.timestamp}] [${entry.level}]`;
    if (level === 'error') console.error(prefix, message, Object.keys(meta).length ? meta : '');
    else if (level === 'warn') console.warn(prefix, message);
    else console.log(prefix, message);
}

const logger = {
    error: (msg, meta) => writeLog('error', msg, meta),
    warn: (msg, meta) => writeLog('warn', msg, meta),
    info: (msg, meta) => writeLog('info', msg, meta),
    debug: (msg, meta) => writeLog('debug', msg, meta),
};

// Express request logging middleware
function requestLogger(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        logger[level](`${req.method} ${req.originalUrl} ${res.statusCode}`, {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        });
    });
    
    next();
}

module.exports = { logger, requestLogger };

