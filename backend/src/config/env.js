const path = require('node:path');

/** Loads backend/.env when present (Node 20.12+ built-in loader). */
try {
    process.loadEnvFile(path.resolve(__dirname, '../../.env'));
} catch (error) {
    if (error.code !== 'ENOENT') {
        throw error;
    }
}

function readInteger(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') {
        return fallback;
    }

    const value = Number(raw);
    if (!Number.isInteger(value) || value < min || value > max) {
        throw new Error(`${name} must be an integer between ${min} and ${max}`);
    }
    return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'dev-only-insecure-jwt-secret-change-me');

if (!jwtSecret) {
    throw new Error('JWT_SECRET is required in production');
}

module.exports = {
    nodeEnv,
    isProduction,
    isTest: nodeEnv === 'test',
    port: readInteger('PORT', 3000, { min: 1, max: 65535 }),
    host: process.env.HOST || '0.0.0.0',
    mongodbUri: process.env.MONGODB_URI || '',
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieName: process.env.COOKIE_NAME || 'tms_token',
    cookieSecure: process.env.COOKIE_SECURE === 'true' || isProduction,
    clientOrigin: process.env.CLIENT_ORIGIN || '*',
    centerTimezone: process.env.CENTER_TIMEZONE || 'Africa/Algiers',
};
