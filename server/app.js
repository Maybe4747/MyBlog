import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 导入路由
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profiles.js';
import fileRoutes from './routes/files.js';
import socialRoutes from './routes/social.js';
import searchRoutes from './routes/search.js';
import notificationRoutes from './routes/notifications.js';

// 创建Express应用
const app = express();

// 基础中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS配置
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// 静态文件服务
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = join(__dirname, 'uploads');

app.use('/uploads', express.static(uploadsDir));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('错误堆栈:', err.stack);

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: '无效的访问令牌'
    });
  }

  // Token过期错误
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: '访问令牌已过期'
    });
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '数据验证失败',
      details: err.message
    });
  }

  // 默认错误响应
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
