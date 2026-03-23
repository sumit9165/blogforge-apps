const router = require('express').Router();
const { register, login, logout, refresh, getCsrfToken, getMe } = require('../controllers/authController');
const { authenticate, csrfProtect } = require('../middleware/auth');
const { validate, registerRules, loginRules } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Get CSRF token (public)
router.get('/csrf-token', getCsrfToken);

// Auth actions
router.post('/register', authLimiter, registerRules, validate, csrfProtect, register);
router.post('/login',    authLimiter, loginRules,    validate, csrfProtect, login);
router.post('/logout',   csrfProtect, logout);
router.post('/refresh',  refresh);

// Protected
router.get('/me', authenticate, getMe);

module.exports = router;
