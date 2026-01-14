import express from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { getMySQLPool } from '../config/database.js';
import { generateToken, generateRefreshToken, authenticateToken, verifyRefreshToken } from '../middleware/auth.js';
import { createUserProfile, getUserByUsername } from '../services/userService.js';

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
        'INSERT INTO users (username, email, password, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [username, email, hashedPassword]
      );

      const userId = userResult.insertId;

      // 在MySQL中创建用户档案
      await createUserProfile(userId, {
        bio: '',
        location: '',
        website: '',
        company: '',
        position: '',
        skills: [],
        socialLinks: {},
        profileVisibility: 'public',
        showEmail: false,
        showActivity: true
      }, connection);

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
  body('email')
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

    const { email, password } = req.body;
    const pool = getMySQLPool();

    // 查找用户（支持用户名或邮箱登录）
    const [users] = await pool.execute(
      'SELECT id, username, email, password FROM users WHERE username = ? OR email = ?',
      [email, email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        code: 1,
        data: null,
        msg: '用户名或密码错误'
      });
    }

    const user = users[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        code: 1,
        data: null,
        msg: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // 生成JWT令牌和刷新令牌
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      code: 0,
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      },
      msg: '登录成功'
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 1,
      data: null,
      msg: '登录失败，请稍后重试'
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
    const user = await getUserByUsername(req.user.username);

    if (!user) {
      return res.status(404).json({
        code: 1,
        data: null,
        msg: '用户不存在'
      });
    }

    res.json({
      code: 0,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          website: user.website,
          coverImage: user.cover_image || null,
          skills: user.skills,
          socialLinks: user.socialLinks,
          privacySettings: {
            profileVisibility: user.privacySettings?.profile_visibility || 'public',
            showEmail: user.privacySettings?.show_email || false,
            showActivity: user.privacySettings?.show_activity || true
          }
        }
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 1,
      data: null,
      msg: '获取用户信息失败'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    使用刷新令牌获取新的访问令牌
 * @access  Public (但需要有效的刷新令牌)
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.query.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        code: 1,
        data: null,
        msg: '未提供刷新令牌'
      });
    }

    // 验证刷新令牌
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        code: 1,
        data: null,
        msg: '无效的刷新令牌'
      });
    }

    // 生成新的访问令牌
    const newToken = generateToken(decoded.userId);

    // 生成新的刷新令牌
    const newRefreshToken = generateRefreshToken(decoded.userId);

    // 查询用户信息
    const pool = getMySQLPool();
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        code: 1,
        data: null,
        msg: '用户不存在'
      });
    }

    res.json({
      code: 0,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: users[0].id,
          username: users[0].username,
          email: users[0].email,
          avatar: users[0].avatar
        }
      },
      msg: '令牌刷新成功'
    });

  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({
      code: 1,
      data: null,
      msg: '刷新令牌失败'
    });
  }
});

export default router;
