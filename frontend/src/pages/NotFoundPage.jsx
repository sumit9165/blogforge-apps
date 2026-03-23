import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="not-found__bg" aria-hidden="true">
        <div className="not-found__num">404</div>
      </div>
      <div className="not-found__content">
        <span className="not-found__icon">🧭</span>
        <h1 className="not-found__title">Lost in the pages</h1>
        <p className="not-found__sub">
          The story you're looking for doesn't exist here.<br />
          Maybe it was deleted, or the URL is wrong.
        </p>
        <div className="not-found__actions">
          <Link to="/" className="btn btn-primary btn-lg">Back to Home</Link>
          <Link to="/blogs" className="btn btn-outline btn-lg">Browse Stories</Link>
        </div>
      </div>
    </div>
  );
}
