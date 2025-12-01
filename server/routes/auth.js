import express from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { getMySQLPool } from '../config/database.js';
import User from '../models/User.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const { username, email, password } = req.body;
    const pool = getMySQLPool();

    // 检查用户是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: '用户名或邮箱已被使用'
      });
    }

    // 加密密码
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 开启事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 在MySQL中创建用户
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      const userId = userResult.insertId;

      // 在MongoDB中创建用户档案
      await User.create({
        userId,
        username,
        email,
        password: hashedPassword
      });

      await connection.commit();

      // 生成JWT令牌
      const token = generateToken(userId);

      res.status(201).json({
        message: '注册成功',
        token,
        user: {
          id: userId,
          username,
          email
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      error: '注册失败，请稍后重试'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', [
  body('loginId')
    .notEmpty()
    .withMessage('请提供用户名或邮箱'),
  body('password')
    .notEmpty()
    .withMessage('请提供密码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const { loginId, password } = req.body;
    const pool = getMySQLPool();

    // 查找用户（支持用户名或邮箱登录）
    const [users] = await pool.execute(
      'SELECT id, username, email, password FROM users WHERE username = ? OR email = ?',
      [loginId, loginId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: '用户名或密码错误'
      });
    }

    const user = users[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // 生成JWT令牌
    const token = generateToken(user.id);

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      error: '登录失败，请稍后重试'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.id });

    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    res.json({
      user: {
        id: user.userId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        skills: user.skills,
        experience: user.experience,
        education: user.education,
        socialLinks: user.socialLinks,
        privacySettings: user.privacySettings
      }
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      error: '获取用户信息失败'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新访问令牌
 * @access  Private
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // 生成新的令牌
    const token = generateToken(req.user.id);

    res.json({
      token,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar
      }
    });

  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({
      error: '刷新令牌失败'
    });
  }
});

export default router;
