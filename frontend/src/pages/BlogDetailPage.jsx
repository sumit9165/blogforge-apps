import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import './BlogDetailPage.css';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/blogs/${slug}`)
      .then(({ data }) => setBlog(data.blog))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="blog-detail-loading">
      <div className="container--narrow">
        <div className="skeleton" style={{ height: 40, width: '80%', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: 300, borderRadius: '12px', marginBottom: '2rem' }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 16, marginBottom: '0.75rem', width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  );

  if (notFound) return (
    <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
      <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>📭</span>
      <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>Story not found</h1>
      <p style={{ color: 'var(--slate)', marginBottom: '2rem' }}>This post may have been removed or doesn't exist.</p>
      <Link to="/blogs" className="btn btn-primary">Browse all stories</Link>
    </div>
  );

  if (!blog) return null;

  return (
    <article className="blog-detail animate-fade-in">
      {/* Hero */}
      <div className="blog-detail__hero">
        <div className="container--narrow">
          {/* Tags */}
          {blog.tags?.length > 0 && (
            <div className="blog-detail__tags">
              {blog.tags.map(tag => (
                <Link key={tag} to={`/blogs?search=${tag}`} className="blog-detail__tag">#{tag}</Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="blog-detail__title">{blog.title}</h1>

          {/* Meta row */}
          <div className="blog-detail__meta">
            <div className="blog-detail__author">
              <div className="blog-detail__avatar">
                {(blog.display_name || blog.username || 'A')[0].toUpperCase()}
              </div>
              <div className="blog-detail__author-info">
                <strong>{blog.display_name || blog.username}</strong>
                <span>
                  {blog.published_at && format(new Date(blog.published_at), 'MMMM d, yyyy')}
                  {' · '}
                  {blog.read_time} min read
                  {blog.views > 0 && ` · ${blog.views.toLocaleString()} views`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {blog.cover_image && (
        <div className="blog-detail__cover">
          <img src={blog.cover_image} alt={blog.title} />
        </div>
      )}

      {/* Content */}
      <div className="container--narrow">
        {blog.excerpt && (
          <p className="blog-detail__excerpt">{blog.excerpt}</p>
        )}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Author Bio */}
        {blog.author_bio && (
          <div className="blog-detail__author-bio">
            <div className="blog-detail__avatar blog-detail__avatar--lg">
              {(blog.display_name || blog.username || 'A')[0].toUpperCase()}
            </div>
            <div>
              <strong>{blog.display_name || blog.username}</strong>
              <p>{blog.author_bio}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="blog-detail__footer">
          <Link to="/blogs" className="btn btn-outline">← All Stories</Link>
        </div>
      </div>
    </article>
  );
}
