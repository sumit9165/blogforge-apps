import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('credential')) setErrors({ password: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-card__left">
          <div className="auth-card__brand">
            <span style={{ color: 'var(--gold)', fontSize: '1.5rem' }}>✦</span>
            <span>BlogForge</span>
          </div>
          <blockquote className="auth-card__quote">
            "Writing is thinking. To write well is to think clearly."
            <cite>— David McCullough</cite>
          </blockquote>
          <div className="auth-card__decor" aria-hidden="true">
            {[...Array(5)].map((_, i) => <div key={i} className="auth-card__decor-line" />)}
          </div>
        </div>

        <div className="auth-card__right">
          <div className="auth-card__header">
            <h1>Welcome back</h1>
            <p>Sign in to continue writing</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Your password"
                  autoComplete="current-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button type="button" className="auth-form__eye" onClick={() => setShowPass(v => !v)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary auth-form__submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <p className="auth-card__switch">
            Don't have an account?{' '}
            <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
