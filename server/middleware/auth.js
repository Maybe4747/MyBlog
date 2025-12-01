import jwt from 'jsonwebtoken';
import { getMySQLPool } from '../config/database.js';

/**
 * JWT认证中间件
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: '未提供访问令牌'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查询用户信息
    const pool = getMySQLPool();
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: '用户不存在'
      });
    }

    // 将用户信息附加到请求对象
    req.user = users[0];
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: '无效的访问令牌'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '访问令牌已过期'
      });
    }

    console.error('认证中间件错误:', error);
    res.status(500).json({
      error: '认证过程中发生错误'
    });
  }
};

/**
 * 可选认证中间件（不强制要求登录）
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const pool = getMySQLPool();
      const [users] = await pool.execute(
        'SELECT id, username, email, avatar FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length > 0) {
        req.user = users[0];
      }
    }

    next();
  } catch (error) {
    // 静默失败，不阻止请求
    next();
  }
};

/**
 * 权限检查中间件
 */
export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: '未认证'
      });
    }

    // 这里可以根据需要实现更复杂的权限检查逻辑
    // 例如：检查用户角色、权限等

    next();
  };
};

/**
 * 生成JWT令牌
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * 验证JWT令牌（不依赖中间件）
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
