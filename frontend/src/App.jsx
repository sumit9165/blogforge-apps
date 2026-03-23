import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BlogListPage from './pages/BlogListPage';
import BlogDetailPage from './pages/BlogDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <div className="page">
      <Navbar />
      <main className="page-main">
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/blogs"         element={<BlogListPage />} />
          <Route path="/blogs/:slug"   element={<BlogDetailPage />} />
          <Route path="/login"         element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register"      element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/dashboard"     element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/editor"        element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/editor/:id"    element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="*"              element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
