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
import experienceRoutes from './routes/experiences.js';
import educationRoutes from './routes/educations.js';
import fileRoutes from './routes/files.js';
import socialRoutes from './routes/social.js';
import messageRoutes from './routes/messages.js';
import searchRoutes from './routes/search.js';
import notificationRoutes from './routes/notifications.js';
import activityRoutes from './routes/activity.js';

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
  origin: function (origin, callback) {
    // 在开发环境中允许多个前端地址
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5174',
      'http://localhost:5173',
      'http://localhost:5174'
    ];

    // 如果 origin 是 undefined（例如服务器到服务器请求），则允许
    if (!origin) return callback(null, true);

    // 检查 origin 是否在允许列表中
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 限流配置 - 开发环境下跳过限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 15分钟内最多1000个请求（原来是100）
  message: {
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development' // 开发环境下跳过限流
});

// 为认证相关的API路径使用更严格的限流（防止暴力破解）
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 认证相关的请求限制更严格，防止暴力破解
  message: {
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 对于认证端点使用单独的限流策略
app.use('/api/auth/', authLimiter);

// 对其他API使用一般限流（开发环境下跳过）
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
app.use('/api/experiences', experienceRoutes);
app.use('/api/educations', educationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);

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
      code: 1,
      data: null,
      msg: '无效的访问令牌'
    });
  }

  // Token过期错误
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 1,
      data: null,
      msg: '访问令牌已过期'
    });
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 1,
      data: {
        details: err.message
      },
      msg: '数据验证失败'
    });
  }

  // 默认错误响应
  res.status(err.status || 500).json({
    code: 1,
    data: {
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    msg: err.message || '服务器内部错误'
  });
});

export default app;
