import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Home from './pages/home/index.jsx';
import Article from './pages/article/index.jsx';
import Project from './pages/Project/index.jsx';
import About from './pages/About/index.jsx';
import Enter from './pages/enter/index.jsx';
import { BrowserRouter, Route, Routes } from 'react-router';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<Enter />} />
        <Route path="/home" element={<Home />} />
        <Route path="/article" element={<Article />} />
        <Route path="/project" element={<Project />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
