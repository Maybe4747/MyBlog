import { StrictMode } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router';
import Home from './pages/home/index.jsx';
import Login from './pages/login/index.jsx';
import Register from './pages/register/index.jsx';
import Profile from './pages/profile/index.jsx';
import Upload from './pages/upload/index.jsx';
import Search from './pages/search/index.jsx';
import Notifications from './pages/notifications/index.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 首页 - Enter页面 */}
          <Route index element={<Navigate to="/enter" replace />} />
          <Route path="/enter" element={<Navigate to="/login" replace />} />

          {/* 认证页面 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 主要功能页面 */}
          <Route path="/home" element={<Home />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
