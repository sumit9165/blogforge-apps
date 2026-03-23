const router = require('express').Router();
const {
  listPublished, getBySlug,
  myBlogs, getBlogById, createBlog, updateBlog, deleteBlog,
} = require('../controllers/blogController');
const { authenticate } = require('../middleware/auth');
const { csrfProtect } = require('../middleware/auth');
const { validate, blogRules } = require('../middleware/validation');
const { writeLimiter } = require('../middleware/rateLimiter');

// --- Public routes ---
router.get('/', listPublished);
router.get('/:slug', getBySlug);

module.exports = router;

// Export authenticated routes separately for mounting under /my
const myRouter = require('express').Router();
myRouter.use(authenticate);

myRouter.get('/',           myBlogs);
myRouter.get('/:id',        getBlogById);
myRouter.post('/',          writeLimiter, blogRules, validate, csrfProtect, createBlog);
myRouter.put('/:id',        writeLimiter, blogRules, validate, csrfProtect, updateBlog);
myRouter.delete('/:id',     csrfProtect, deleteBlog);

module.exports.myRouter = myRouter;
