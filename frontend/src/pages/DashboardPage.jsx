import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './DashboardPage.css';

function ConfirmModal({ blog, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop animate-fade-in-fast" onClick={onCancel}>
      <div className="modal animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal__icon">🗑️</div>
        <h3 className="modal__title">Delete this post?</h3>
        <p className="modal__body">
          "<strong>{blog.title}</strong>" will be permanently deleted. This action cannot be undone.
        </p>
        <div className="modal__actions">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete Forever</button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [blogs, setBlogs]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [page, setPage]           = useState(1);
  const [deleting, setDeleting]   = useState(null);
  const [confirmBlog, setConfirmBlog] = useState(null);

  const fetchBlogs = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (filter !== 'all') params.status = filter;
    api.get('/my/blogs', { params })
      .then(({ data }) => { setBlogs(data.blogs); setPagination(data.pagination); })
      .catch(() => toast.error('Failed to load your blogs'))
      .finally(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const handleDelete = async () => {
    if (!confirmBlog) return;
    setDeleting(confirmBlog.id);
    try {
      await api.delete(`/my/blogs/${confirmBlog.id}`);
      toast.success('Post deleted');
      setBlogs(bs => bs.filter(b => b.id !== confirmBlog.id));
      setPagination(p => p ? { ...p, total: p.total - 1 } : p);
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(null);
      setConfirmBlog(null);
    }
  };

  const stats = {
    total:     pagination?.total ?? 0,
    published: blogs.filter(b => b.status === 'published').length,
    drafts:    blogs.filter(b => b.status === 'draft').length,
    views:     blogs.reduce((s, b) => s + (b.views || 0), 0),
  };

  return (
    <div className="dashboard">
      {confirmBlog && (
        <ConfirmModal
          blog={confirmBlog}
          onConfirm={handleDelete}
          onCancel={() => setConfirmBlog(null)}
        />
      )}

      {/* Header */}
      <div className="dashboard__header">
        <div className="container">
          <div className="dashboard__greeting">
            <div className="dashboard__avatar">
              {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="dashboard__title">
                {user?.display_name || user?.username}'s Studio
              </h1>
              <p className="dashboard__sub">Manage your writing, drafts, and published stories</p>
            </div>
          </div>

          {/* Stats */}
          <div className="dashboard__stats">
            {[
              { label: 'Total Posts', value: pagination?.total ?? '—' },
              { label: 'Published',   value: filter === 'all' ? '—' : stats.published },
              { label: 'Drafts',      value: filter === 'all' ? '—' : stats.drafts },
              { label: 'Total Views', value: blogs.reduce((s,b) => s + (b.views||0), 0).toLocaleString() },
            ].map(s => (
              <div key={s.label} className="dashboard__stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Toolbar */}
        <div className="dashboard__toolbar">
          <div className="dashboard__filters">
            {['all', 'published', 'draft'].map(f => (
              <button
                key={f}
                className={`dashboard__filter-btn ${filter === f ? 'dashboard__filter-btn--active' : ''}`}
                onClick={() => { setFilter(f); setPage(1); }}
              >
                {f === 'all' ? 'All Posts' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
              </button>
            ))}
          </div>
          <Link to="/editor" className="btn btn-gold">
            ✏️ New Post
          </Link>
        </div>

        {/* Blog List */}
        {loading ? (
          <div className="dashboard__list">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="dashboard__item-skeleton">
                <div className="skeleton" style={{ height: 18, width: '60%' }} />
                <div className="skeleton" style={{ height: 13, width: '30%', marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : blogs.length > 0 ? (
          <div className="dashboard__list animate-fade-in">
            {blogs.map(blog => (
              <div key={blog.id} className="dashboard__item">
                <div className="dashboard__item-main">
                  {/* Cover thumbnail */}
                  {blog.cover_image ? (
                    <div className="dashboard__item-thumb">
                      <img src={blog.cover_image} alt="" loading="lazy" />
                    </div>
                  ) : (
                    <div className="dashboard__item-thumb dashboard__item-thumb--placeholder">
                      ✦
                    </div>
                  )}

                  <div className="dashboard__item-info">
                    <div className="dashboard__item-top">
                      <h3 className="dashboard__item-title">
                        {blog.status === 'published' ? (
                          <Link to={`/blogs/${blog.slug}`}>{blog.title}</Link>
                        ) : (
                          blog.title
                        )}
                      </h3>
                      <span className={`badge badge-${blog.status}`}>
                        {blog.status}
                      </span>
                    </div>

                    <div className="dashboard__item-meta">
                      <span>
                        {blog.status === 'published' && blog.published_at
                          ? `Published ${format(new Date(blog.published_at), 'MMM d, yyyy')}`
                          : `Last edited ${format(new Date(blog.updated_at), 'MMM d, yyyy · h:mm a')}`}
                      </span>
                      <span className="dashboard__item-meta-dot">·</span>
                      <span>{blog.read_time} min read</span>
                      {blog.views > 0 && (
                        <>
                          <span className="dashboard__item-meta-dot">·</span>
                          <span>👁 {blog.views.toLocaleString()} views</span>
                        </>
                      )}
                    </div>

                    {blog.tags?.length > 0 && (
                      <div className="dashboard__item-tags">
                        {blog.tags.slice(0, 4).map(t => (
                          <span key={t} className="dashboard__item-tag">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="dashboard__item-actions">
                  <Link to={`/editor/${blog.id}`} className="btn btn-outline btn-sm">
                    ✏️ Edit
                  </Link>
                  {blog.status === 'published' && (
                    <Link to={`/blogs/${blog.slug}`} className="btn btn-ghost btn-sm" target="_blank">
                      🔗 View
                    </Link>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={deleting === blog.id}
                    onClick={() => setConfirmBlog(blog)}
                  >
                    {deleting === blog.id ? <span className="spinner" /> : '🗑'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon">✍️</span>
            <p className="empty-state__title">
              {filter !== 'all' ? `No ${filter} posts yet` : 'No posts yet'}
            </p>
            <p>Your writing journey starts here.</p>
            <Link to="/editor" className="btn btn-gold" style={{ marginTop: '1.25rem' }}>
              Write your first post
            </Link>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="pagination" style={{ marginTop: 'var(--space-xl)' }}>
            <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: '0.875rem', color: 'var(--slate)' }}>
              Page {page} of {pagination.pages}
            </span>
            <button className="btn btn-outline btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
