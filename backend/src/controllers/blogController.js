const { pool } = require('../config/db');
const { generateSlug, calcReadTime, generateId, sanitizeHtml, sanitizeText } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * GET /api/blogs - Public: list all published blogs
 */
async function listPublished(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const tag = req.query.tag ? sanitizeText(req.query.tag) : null;
    const search = req.query.search ? sanitizeText(req.query.search) : null;

    let whereExtra = '';
    const params = [];

    if (tag) {
      whereExtra += ` AND JSON_CONTAINS(b.tags, ?)`;
      params.push(JSON.stringify(tag));
    }
    if (search) {
      whereExtra += ` AND (b.title LIKE ? OR b.excerpt LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(
      `SELECT b.id, b.title, b.slug, b.excerpt, b.cover_image, b.tags, b.read_time, b.views,
              b.published_at, b.created_at, b.updated_at,
              u.id as author_id, u.username, u.display_name, u.avatar_url
       FROM blogs b
       JOIN users u ON b.user_id = u.id
       WHERE b.status = 'published'${whereExtra}
       ORDER BY b.published_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM blogs b WHERE b.status = 'published'${whereExtra}`,
      params
    );

    return res.json({
      blogs: rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error('listPublished error:', err);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
}

/**
 * GET /api/blogs/:slug - Public: single blog post
 */
async function getBySlug(req, res) {
  try {
    const slug = sanitizeText(req.params.slug);
    const [rows] = await pool.execute(
      `SELECT b.*, u.username, u.display_name, u.avatar_url, u.bio as author_bio
       FROM blogs b JOIN users u ON b.user_id = u.id
       WHERE b.slug = ? AND b.status = 'published'`,
      [slug]
    );

    if (!rows.length) return res.status(404).json({ error: 'Blog not found' });

    // Increment view count (non-blocking)
    pool.execute('UPDATE blogs SET views = views + 1 WHERE id = ?', [rows[0].id]).catch(() => {});

    const blog = { ...rows[0], tags: rows[0].tags ? JSON.parse(rows[0].tags) : [] };
    return res.json({ blog });
  } catch (err) {
    logger.error('getBySlug error:', err);
    return res.status(500).json({ error: 'Failed to fetch blog' });
  }
}

/**
 * GET /api/my/blogs - Auth: list current user's blogs
 */
async function myBlogs(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let whereStatus = '';
    const params = [req.user.id];
    if (status === 'draft' || status === 'published') {
      whereStatus = ` AND status = ?`;
      params.push(status);
    }

    const [rows] = await pool.execute(
      `SELECT id, title, slug, excerpt, cover_image, tags, status, read_time, views, created_at, updated_at, published_at
       FROM blogs WHERE user_id = ?${whereStatus} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM blogs WHERE user_id = ?${whereStatus}`,
      params
    );

    return res.json({
      blogs: rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error('myBlogs error:', err);
    return res.status(500).json({ error: 'Failed to fetch your blogs' });
  }
}

/**
 * GET /api/my/blogs/:id - Auth: get single blog by ID (for editing)
 */
async function getBlogById(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM blogs WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Blog not found' });
    const blog = { ...rows[0], tags: rows[0].tags ? JSON.parse(rows[0].tags) : [] };
    return res.json({ blog });
  } catch (err) {
    logger.error('getBlogById error:', err);
    return res.status(500).json({ error: 'Failed to fetch blog' });
  }
}

/**
 * POST /api/my/blogs - Auth: create blog
 */
async function createBlog(req, res) {
  try {
    const { title, content, excerpt, cover_image, tags, status } = req.body;

    const cleanTitle = sanitizeText(title?.trim());
    const cleanContent = sanitizeHtml(content);
    const cleanExcerpt = sanitizeText(excerpt?.trim() || '');
    const cleanCoverImage = sanitizeText(cover_image?.trim() || '');
    const cleanTags = Array.isArray(tags)
      ? tags.slice(0, 10).map(t => sanitizeText(t.trim())).filter(Boolean)
      : [];
    const blogStatus = status === 'published' ? 'published' : 'draft';

    const id = generateId();
    const slug = generateSlug(cleanTitle);
    const readTime = calcReadTime(cleanContent.replace(/<[^>]*>/g, ''));
    const publishedAt = blogStatus === 'published'
      ? new Date().toISOString().slice(0, 19).replace('T', ' ')
      : null;

    await pool.execute(
      `INSERT INTO blogs (id, user_id, title, slug, excerpt, content, cover_image, tags, status, read_time, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, cleanTitle, slug, cleanExcerpt, cleanContent, cleanCoverImage,
       JSON.stringify(cleanTags), blogStatus, readTime, publishedAt]
    );

    logger.info(`Blog created: ${id} by ${req.user.id}`);
    return res.status(201).json({ message: 'Blog created', id, slug });
  } catch (err) {
    logger.error('createBlog error:', err);
    return res.status(500).json({ error: 'Failed to create blog' });
  }
}

/**
 * PUT /api/my/blogs/:id - Auth: update blog
 */
async function updateBlog(req, res) {
  try {
    const [existing] = await pool.execute(
      'SELECT * FROM blogs WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!existing.length) return res.status(404).json({ error: 'Blog not found' });

    const { title, content, excerpt, cover_image, tags, status } = req.body;

    const cleanTitle = sanitizeText(title?.trim() || existing[0].title);
    const cleanContent = sanitizeHtml(content || existing[0].content);
    const cleanExcerpt = sanitizeText(excerpt?.trim() ?? existing[0].excerpt ?? '');
    const cleanCoverImage = sanitizeText(cover_image?.trim() ?? existing[0].cover_image ?? '');
    const cleanTags = Array.isArray(tags)
      ? tags.slice(0, 10).map(t => sanitizeText(t.trim())).filter(Boolean)
      : (existing[0].tags ? JSON.parse(existing[0].tags) : []);
    const blogStatus = status === 'published' ? 'published' : status === 'draft' ? 'draft' : existing[0].status;
    const readTime = calcReadTime(cleanContent.replace(/<[^>]*>/g, ''));

    let publishedAt = existing[0].published_at;
    if (blogStatus === 'published' && existing[0].status !== 'published') {
      publishedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    await pool.execute(
      `UPDATE blogs SET title=?, excerpt=?, content=?, cover_image=?, tags=?, status=?, read_time=?, published_at=?
       WHERE id = ? AND user_id = ?`,
      [cleanTitle, cleanExcerpt, cleanContent, cleanCoverImage, JSON.stringify(cleanTags),
       blogStatus, readTime, publishedAt, req.params.id, req.user.id]
    );

    logger.info(`Blog updated: ${req.params.id} by ${req.user.id}`);
    return res.json({ message: 'Blog updated', slug: existing[0].slug });
  } catch (err) {
    logger.error('updateBlog error:', err);
    return res.status(500).json({ error: 'Failed to update blog' });
  }
}

/**
 * DELETE /api/my/blogs/:id - Auth: delete blog
 */
async function deleteBlog(req, res) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM blogs WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    logger.info(`Blog deleted: ${req.params.id} by ${req.user.id}`);
    return res.json({ message: 'Blog deleted' });
  } catch (err) {
    logger.error('deleteBlog error:', err);
    return res.status(500).json({ error: 'Failed to delete blog' });
  }
}

module.exports = { listPublished, getBySlug, myBlogs, getBlogById, createBlog, updateBlog, deleteBlog };
