import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── CSRF Token Storage ───────────────────────────────────────
let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = token;
  if (token) {
    document.cookie = `csrf_token=${token}; path=/; SameSite=Lax`;
  }
}

export function getCsrfTokenFromCookie() {
  const match = document.cookie.match(/(?:^|;)\s*csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

// ── Request Interceptor ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = csrfToken || getCsrfTokenFromCookie();
  if (token && !['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase())) {
    config.headers['X-CSRF-Token'] = token;
  }
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Response Interceptor — auto refresh on 401 ───────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers['Authorization'] = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = data.access_token;
        localStorage.setItem('access_token', newToken);
        if (data.csrf_token) setCsrfToken(data.csrf_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        original.headers['Authorization'] = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('access_token');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
