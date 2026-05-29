const rateLimit = require('express-rate-limit');

// ── Auth Rate Limiter (Login / Register) ──────────────────────
// Max 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.'
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json(options.message);
    }
});
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again later.' },
    handler: (req, res, next, options) => { res.status(429).json(options.message); }
});

const doctorLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again later.' },
    handler: (req, res, next, options) => { res.status(429).json(options.message); }
});

const patientLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please try again later.' },
    handler: (req, res, next, options) => { res.status(429).json(options.message); }
});


// ── General API Rate Limiter ───────────────────────────────────
// Max 200 requests per 10 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many API requests. Please slow down.'
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json(options.message);
    }
});

// ── File Download Rate Limiter ─────────────────────────────────
// Max 30 downloads per 10 minutes per IP
const downloadLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many download requests. Please wait before downloading more files.'
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json(options.message);
    }
});

module.exports = { authLimiter, apiLimiter, downloadLimiter, adminLoginLimiter, doctorLoginLimiter, patientLoginLimiter };
