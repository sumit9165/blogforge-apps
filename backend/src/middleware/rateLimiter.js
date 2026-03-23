const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../utils/logger');

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  handler(req, res, next, options) {
    logger.warn(`Rate limit exceeded: ${req.ip} → ${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => req.method === 'OPTIONS',
});

/**
 * Strict limiter for auth endpoints - 10 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
  handler(req, res, next, options) {
    logger.warn(`Auth rate limit exceeded: ${req.ip} → ${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
  keyGenerator: (req) => req.ip + ':' + (req.body?.email || ''),
});

/**
 * Speed limiter - progressively slow down repeated requests
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => hits * 100,
  maxDelayMs: 5000,
});

/**
 * Blog write operations limiter
 */
const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Write rate limit exceeded, please slow down.' },
});

module.exports = { generalLimiter, authLimiter, speedLimiter, writeLimiter };
