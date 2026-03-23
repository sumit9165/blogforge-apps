import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">✦</span>
          <span className="navbar__logo-text">BlogForge</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__links">
          <NavLink to="/blogs" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
            Explore
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
              Dashboard
            </NavLink>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <Link to="/editor" className="btn btn-gold btn-sm">
                + Write
              </Link>
              <div className="navbar__avatar-menu">
                <button className="navbar__avatar" onClick={() => setMenuOpen(v => !v)}>
                  {user?.display_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </button>
                {menuOpen && (
                  <div className="navbar__dropdown animate-fade-in-fast">
                    <div className="navbar__dropdown-header">
                      <strong>{user?.display_name || user?.username}</strong>
                      <span>{user?.email}</span>
                    </div>
                    <Link to="/dashboard" className="navbar__dropdown-item" onClick={() => setMenuOpen(false)}>
                      📝 My Blogs
                    </Link>
                    <Link to="/editor" className="navbar__dropdown-item" onClick={() => setMenuOpen(false)}>
                      ✏️ New Post
                    </Link>
                    <button onClick={handleLogout} className="navbar__dropdown-item navbar__dropdown-item--danger">
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile animate-fade-in-fast">
          <NavLink to="/blogs" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Explore</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
              <NavLink to="/editor" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Write New Post</NavLink>
              <button onClick={handleLogout} className="navbar__mobile-link navbar__mobile-link--danger">Sign Out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Sign In</NavLink>
              <NavLink to="/register" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Get Started</NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
