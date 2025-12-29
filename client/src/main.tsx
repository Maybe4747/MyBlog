import { StrictMode } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/home/index';
import Login from './pages/login/index';
import Register from './pages/register/index';
import Profile from './pages/profile/index';
import Upload from './pages/upload/index';
import Search from './pages/search/index';
import Notifications from './pages/notifications/index';
import ArticleDetail from './pages/article/index';
import FileDetail from './pages/file/index';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      {/* <ErrorBoundary> */}
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* 首页 - Enter页面 */}
              <Route index element={<Navigate to="/enter" replace />} />
              <Route path="/enter" element={<Navigate to="/login" replace />} />

              {/* 认证页面 */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* 主要功能页面 - 需要认证 */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:username"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/articles/:articleId"
                element={
                  <ProtectedRoute>
                    <ArticleDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/files/:fileId"
                element={
                  <ProtectedRoute>
                    <FileDetail />
                  </ProtectedRoute>
                }
              />

              {/* 默认重定向 */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      {/* </ErrorBoundary> */}
    </StrictMode>
  );
}
