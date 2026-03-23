import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f0e0d',
              color: '#faf8f5',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem',
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 12px 40px rgba(15,14,13,0.18)',
            },
            success: {
              iconTheme: { primary: '#c9973a', secondary: '#0f0e0d' },
            },
            error: {
              iconTheme: { primary: '#c0442a', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
