const { body, validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3–50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username may only contain letters, numbers, _ and -'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  body('display_name').optional().trim().isLength({ max: 100 }),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const blogRules = [
  body('title').trim().isLength({ min: 3, max: 255 }).withMessage('Title must be 3–255 characters'),
  body('content').notEmpty().withMessage('Content is required'),
  body('excerpt').optional().trim().isLength({ max: 500 }),
  body('cover_image').optional().trim().isURL({ require_protocol: true }).withMessage('Invalid URL for cover image'),
  body('tags').optional().isArray({ max: 10 }).withMessage('Tags must be an array of up to 10 items'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
];

module.exports = { validate, registerRules, loginRules, blogRules };
