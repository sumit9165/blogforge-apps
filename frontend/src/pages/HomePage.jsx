import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import BlogCard from '../components/BlogCard';
import './HomePage.css';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blogs?limit=6').then(({ data }) => {
      setFeatured(data.blogs || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__circle hero__circle--1" />
          <div className="hero__circle hero__circle--2" />
          <div className="hero__lines" aria-hidden="true">
            {[...Array(8)].map((_, i) => <div key={i} className="hero__line" />)}
          </div>
        </div>
        <div className="container hero__content">
          <div className="hero__eyebrow">
            <span className="hero__dot" />
            A space for writers
          </div>
          <h1 className="hero__title">
            Where great<br />
            <em>ideas</em> find<br />
            their voice
          </h1>
          <p className="hero__sub">
            Craft, publish, and share stories that inspire.
            BlogForge is your minimalist stage for meaningful writing.
          </p>
          <div className="hero__actions">
            <Link to="/register" className="btn btn-gold btn-lg">Start Writing Free</Link>
            <Link to="/blogs" className="btn btn-outline btn-lg">Read Stories</Link>
          </div>

          {/* Stats */}
          <div className="hero__stats">
            <div className="hero__stat">
              <strong>Rich Editor</strong>
              <span>Full markdown & rich text</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong>Public Blogs</strong>
              <span>Share with the world</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong>Secure</strong>
              <span>CSRF, XSS & DDoS protected</span>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="marquee__track">
              Write ✦ Publish ✦ Inspire ✦ Create ✦ Share ✦ Discover ✦ Connect ✦ Express ✦&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Latest Posts */}
      <section className="home-section">
        <div className="container">
          <div className="home-section__header">
            <div>
              <p className="home-section__label">From the community</p>
              <h2 className="home-section__title">Latest Stories</h2>
            </div>
            <Link to="/blogs" className="btn btn-outline">Browse all →</Link>
          </div>

          {loading ? (
            <div className="blog-grid stagger">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="blog-card-skeleton">
                  <div className="skeleton" style={{ height: 180 }} />
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="skeleton" style={{ height: 14, width: '40%' }} />
                    <div className="skeleton" style={{ height: 22 }} />
                    <div className="skeleton" style={{ height: 14 }} />
                    <div className="skeleton" style={{ height: 14, width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="blog-grid stagger">
              {featured.map(blog => <BlogCard key={blog.id} blog={blog} />)}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state__icon">📖</span>
              <p className="empty-state__title">No stories yet</p>
              <p>Be the first to publish!</p>
              <Link to="/register" className="btn btn-gold" style={{ marginTop: '1rem' }}>Start Writing</Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="home-cta">
        <div className="container">
          <div className="home-cta__inner">
            <div className="home-cta__text">
              <h2>Ready to share your story?</h2>
              <p>Join writers who choose clarity over noise.</p>
            </div>
            <div className="home-cta__actions">
              <Link to="/register" className="btn btn-gold btn-lg">Create Free Account</Link>
              <Link to="/login" className="btn btn-outline" style={{ borderColor: 'rgba(250,248,245,0.3)', color: 'var(--paper)' }}>Sign In</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
