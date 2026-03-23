import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]   = useState({ username: '', email: '', password: '', display_name: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.username || form.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(form.username)) e.username = 'Only letters, numbers, _ and - allowed';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 8) e.password = 'Min 8 characters';
    if (!/[A-Z]/.test(form.password)) e.password = 'Must contain uppercase, lowercase, and a number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.display_name);
      toast.success('Account created! Welcome to BlogForge 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('username')) {
        setErrors({ email: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'var(--rust)', '#d4a500', 'var(--sage)', 'var(--sage)'][strength];

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-card__left">
          <div className="auth-card__brand">
            <span style={{ color: 'var(--gold)', fontSize: '1.5rem' }}>✦</span>
            <span>BlogForge</span>
          </div>
          <blockquote className="auth-card__quote">
            "Start writing, no matter what. The water does not flow until the faucet is turned on."
            <cite>— Louis L'Amour</cite>
          </blockquote>
          <div className="auth-card__decor" aria-hidden="true">
            {[...Array(5)].map((_, i) => <div key={i} className="auth-card__decor-line" />)}
          </div>
        </div>

        <div className="auth-card__right">
          <div className="auth-card__header">
            <h1>Create your account</h1>
            <p>Free forever. Start writing today.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="auth-form__row">
              <div className="form-group">
                <label className="form-label" htmlFor="display_name">Display Name</label>
                <input
                  id="display_name"
                  type="text"
                  className="form-input"
                  value={form.display_name}
                  onChange={set('display_name')}
                  placeholder="Your full name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username <span style={{ color: 'var(--rust)' }}>*</span></label>
                <input
                  id="username"
                  type="text"
                  className={`form-input ${errors.username ? 'form-input--error' : ''}`}
                  value={form.username}
                  onChange={set('username')}
                  placeholder="yourhandle"
                  autoComplete="username"
                />
                {errors.username && <span className="form-error">{errors.username}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address <span style={{ color: 'var(--rust)' }}>*</span></label>
              <input
                id="email"
                type="email"
                className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password <span style={{ color: 'var(--rust)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min 8 chars, uppercase + number"
                  autoComplete="new-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button type="button" className="auth-form__eye" onClick={() => setShowPass(v => !v)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {form.password && (
                <div className="auth-form__strength">
                  <div className="auth-form__strength-bar">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="auth-form__strength-seg"
                        style={{ background: i <= strength ? strengthColor : 'var(--paper-edge)' }} />
                    ))}
                  </div>
                  <span style={{ color: strengthColor, fontSize: '0.78rem', fontWeight: 500 }}>{strengthLabel}</span>
                </div>
              )}
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-gold auth-form__submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
            </button>
          </form>

          <p className="auth-card__switch">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
