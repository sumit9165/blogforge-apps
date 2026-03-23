const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * Verify JWT access token from Authorization header or httpOnly cookie
 */
async function authenticate(req, res, next) {
  try {
    let token = null;

    // Prefer Authorization header (Bearer token)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check user still exists and is active
    const [rows] = await pool.execute(
      'SELECT id, username, email, display_name, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    logger.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Optional auth - attaches user if token present, doesn't fail if absent
 */
async function optionalAuth(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await pool.execute(
        'SELECT id, username, email, display_name, role FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId]
      );
      if (rows.length) req.user = rows[0];
    }
  } catch (_) {
    // Silently ignore token errors for optional auth
  }
  next();
}

/**
 * CSRF token validator - compares request header with session/cookie value
 * Using the double-submit cookie pattern
 */
function csrfProtect(req, res, next) {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromCookie = req.cookies && req.cookies['csrf_token'];

  if (!tokenFromHeader || !tokenFromCookie) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  if (tokenFromHeader !== tokenFromCookie) {
    logger.warn(`CSRF mismatch from IP: ${req.ip}`);
    return res.status(403).json({ error: 'CSRF token invalid' });
  }

  next();
}

module.exports = { authenticate, optionalAuth, csrfProtect };
