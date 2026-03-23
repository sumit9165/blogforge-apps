const { v4: uuidv4 } = require('uuid');
const xss = require('xss');

/**
 * Generate URL-safe slug from title
 */
function generateSlug(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
  return `${base}-${Date.now()}`;
}

/**
 * Estimate read time in minutes
 */
function calcReadTime(content) {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Generate UUID v4
 */
function generateId() {
  return uuidv4();
}

/**
 * Sanitize HTML content to prevent XSS
 */
function sanitizeHtml(dirty) {
  return xss(dirty, {
    whiteList: {
      h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
      p: [], br: [], strong: [], em: [], u: [], s: [],
      blockquote: [], pre: [], code: ['class'],
      ul: [], ol: [], li: [],
      a: ['href', 'title', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      table: [], thead: [], tbody: [], tr: [], th: [], td: [],
      div: ['class'], span: ['class'],
      hr: [],
    },
    onTagAttr(tag, name, value) {
      // Allow only safe href values
      if (tag === 'a' && name === 'href') {
        if (/^(javascript|data|vbscript):/i.test(value)) return '';
      }
    },
  });
}

/**
 * Sanitize plain text (strip all HTML)
 */
function sanitizeText(text) {
  return xss(text, { whiteList: {} });
}

module.exports = { generateSlug, calcReadTime, generateId, sanitizeHtml, sanitizeText };
