import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span style={{ color: 'var(--gold)' }}>✦</span> BlogForge
            </Link>
            <p className="footer__tagline">A place for ideas worth sharing.</p>
          </div>
          <div className="footer__links-group">
            <h4>Explore</h4>
            <Link to="/blogs">All Posts</Link>
            <Link to="/register">Start Writing</Link>
          </div>
          <div className="footer__links-group">
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} BlogForge. Built with care.</span>
          <div className="footer__ornament">✦ ✦ ✦</div>
        </div>
      </div>
    </footer>
  );
}
