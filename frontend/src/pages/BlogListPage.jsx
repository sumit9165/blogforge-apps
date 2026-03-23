import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import BlogCard from '../components/BlogCard';
import './BlogListPage.css';

export default function BlogListPage() {
  const [blogs, setBlogs]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const page   = parseInt(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(search);

  const fetchBlogs = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 9 };
    if (search) params.search = search;
    api.get('/blogs', { params })
      .then(({ data }) => { setBlogs(data.blogs); setPagination(data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(searchInput ? { search: searchInput, page: '1' } : { page: '1' });
  };

  const goToPage = (p) => {
    const params = { page: String(p) };
    if (search) params.search = search;
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="blog-list-page">
      <div className="blog-list-page__header">
        <div className="container">
          <p className="blog-list-page__label">Community Writing</p>
          <h1 className="blog-list-page__title">All Stories</h1>
          <p className="blog-list-page__sub">Explore ideas from writers around the world</p>

          {/* Search */}
          <form className="blog-list-page__search" onSubmit={handleSearch}>
            <div className="blog-list-page__search-wrap">
              <span className="blog-list-page__search-icon">🔍</span>
              <input
                type="search"
                className="form-input blog-list-page__search-input"
                placeholder="Search stories…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button type="button" className="blog-list-page__search-clear"
                  onClick={() => { setSearchInput(''); setSearchParams({ page: '1' }); }}>
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </div>

      <div className="container">
        {search && (
          <div className="blog-list-page__search-info">
            {loading ? 'Searching…' : `${pagination?.total || 0} result${pagination?.total !== 1 ? 's' : ''} for "${search}"`}
          </div>
        )}

        {loading ? (
          <div className="blog-grid stagger">
            {[...Array(9)].map((_, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid var(--paper-edge)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 160 }} />
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="skeleton" style={{ height: 12, width: '30%' }} />
                  <div className="skeleton" style={{ height: 20 }} />
                  <div className="skeleton" style={{ height: 12, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length > 0 ? (
          <div className="blog-grid stagger animate-fade-in">
            {blogs.map(blog => <BlogCard key={blog.id} blog={blog} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon">✍️</span>
            <p className="empty-state__title">
              {search ? 'No stories match your search' : 'No stories yet'}
            </p>
            <p>{search ? 'Try different keywords' : 'Be the first to publish!'}</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="pagination">
            <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              ← Previous
            </button>
            <div className="pagination__pages">
              {[...Array(pagination.pages)].map((_, i) => {
                const p = i + 1;
                if (pagination.pages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== pagination.pages) {
                  if (p === 2 || p === pagination.pages - 1) return <span key={p} className="pagination__ellipsis">…</span>;
                  return null;
                }
                return (
                  <button
                    key={p}
                    className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button className="btn btn-outline btn-sm" disabled={page >= pagination.pages} onClick={() => goToPage(page + 1)}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
