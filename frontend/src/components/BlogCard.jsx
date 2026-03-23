import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import './BlogCard.css';

export default function BlogCard({ blog, showAuthor = true }) {
  const date = blog.published_at || blog.created_at;

  return (
    <article className="blog-card animate-fade-in">
      {blog.cover_image && (
        <Link to={`/blogs/${blog.slug}`} className="blog-card__cover-link">
          <div className="blog-card__cover">
            <img src={blog.cover_image} alt={blog.title} loading="lazy" />
          </div>
        </Link>
      )}
      <div className="blog-card__body">
        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="blog-card__tags">
            {blog.tags.slice(0, 3).map(tag => (
              <span key={tag} className="blog-card__tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="blog-card__title">
          <Link to={`/blogs/${blog.slug}`}>{blog.title}</Link>
        </h2>

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="blog-card__excerpt">{blog.excerpt}</p>
        )}

        {/* Meta */}
        <div className="blog-card__meta">
          {showAuthor && (
            <div className="blog-card__author">
              <div className="blog-card__avatar">
                {(blog.display_name || blog.username || 'A')[0].toUpperCase()}
              </div>
              <span>{blog.display_name || blog.username}</span>
            </div>
          )}
          <div className="blog-card__meta-right">
            {date && (
              <time className="blog-card__date" dateTime={date}>
                {format(new Date(date), 'MMM d, yyyy')}
              </time>
            )}
            <span className="blog-card__read-time">{blog.read_time} min read</span>
          </div>
        </div>
      </div>
    </article>
  );
}
