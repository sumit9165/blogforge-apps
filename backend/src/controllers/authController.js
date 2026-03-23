const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { generateId, sanitizeText } = require('../utils/helpers');
const logger = require('../utils/logger');

const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function setCookies(res, accessToken, refreshToken, csrfToken) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    secure: isProd || process.env.COOKIE_SECURE === 'true',
    sameSite: isProd ? 'strict' : (process.env.COOKIE_SAME_SITE || 'lax'),
    path: '/',
  };

  res.cookie('access_token', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...cookieOpts, maxAge: REFRESH_TOKEN_EXPIRY_MS });
  // CSRF token is NOT httpOnly so JS can read and send it in headers
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: '/',
    maxAge: 15 * 60 * 1000,
  });
}

async function register(req, res) {
  try {
    const { username, email, password, display_name } = req.body;

    const cleanUsername = sanitizeText(username?.trim());
    const cleanEmail = email?.trim().toLowerCase();
    const cleanDisplayName = sanitizeText(display_name?.trim() || cleanUsername);

    // Check duplicates
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [cleanEmail, cleanUsername]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = generateId();

    await pool.execute(
      'INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)',
      [userId, cleanUsername, cleanEmail, passwordHash, cleanDisplayName]
    );

    logger.info(`New user registered: ${cleanEmail}`);

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken();
    const csrfToken = generateCsrfToken();

    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS).toISOString().slice(0, 19).replace('T', ' ');
    await pool.execute(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, refreshHash, expiresAt]
    );

    setCookies(res, accessToken, refreshToken, csrfToken);

    return res.status(201).json({
      message: 'Registration successful',
      user: { id: userId, username: cleanUsername, email: cleanEmail, display_name: cleanDisplayName, role: 'user' },
      access_token: accessToken,
      csrf_token: csrfToken,
    });
  } catch (err) {
    logger.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const cleanEmail = email?.trim().toLowerCase();

    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, display_name, role, is_active FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      logger.warn(`Failed login attempt for: ${cleanEmail} from ${req.ip}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    const csrfToken = generateCsrfToken();

    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS).toISOString().slice(0, 19).replace('T', ' ');

    // Clean old refresh tokens for this user
    await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ? AND expires_at < NOW()', [user.id]);
    await pool.execute(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [uuidv4(), user.id, refreshHash, expiresAt]
    );

    setCookies(res, accessToken, refreshToken, csrfToken);

    logger.info(`User logged in: ${cleanEmail}`);

    return res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, display_name: user.display_name, role: user.role },
      access_token: accessToken,
      csrf_token: csrfToken,
    });
  } catch (err) {
    logger.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
}

async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const refreshHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
      await pool.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [refreshHash]);
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('csrf_token');

    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('Logout error:', err);
    return res.status(500).json({ error: 'Logout failed' });
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token missing' });
    }

    const refreshHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
    const [rows] = await pool.execute(
      'SELECT rt.*, u.id as uid, u.is_active FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token_hash = ? AND rt.expires_at > NOW()',
      [refreshHash]
    );

    if (!rows.length || !rows[0].is_active) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      res.clearCookie('csrf_token');
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const userId = rows[0].uid;
    const newAccessToken = generateAccessToken(userId);
    const newCsrfToken = generateCsrfToken();

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('csrf_token', newCsrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ access_token: newAccessToken, csrf_token: newCsrfToken });
  } catch (err) {
    logger.error('Refresh error:', err);
    return res.status(500).json({ error: 'Token refresh failed' });
  }
}

async function getCsrfToken(req, res) {
  const csrfToken = generateCsrfToken();
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('csrf_token', csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  return res.json({ csrf_token: csrfToken });
}

async function getMe(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, logout, refresh, getCsrfToken, getMe };
