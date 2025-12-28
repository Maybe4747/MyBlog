import express from 'express';
import { body, validationResult } from 'express-validator';
import { getUserByUsername, updateUserProfile, getUserStats } from '../services/userService.js';
import { getUserFiles } from '../services/fileService.js';
import { getMySQLPool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/users/:username
 * @desc    获取用户公开信息
 * @access  Public
 */
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 获取用户统计信息
    const stats = await getUserStats(user.id);

    res.json({
      code: 0,
      data: {
        user: {
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          website: user.website,
          skills: user.skills,
          socialLinks: user.socialLinks,
          isActive: true // 假设用户是活跃的，如果需要可以从users表的其他字段获取
        },
        stats: stats
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      error: '获取用户信息失败'
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    更新用户档案
 * @access  Private
 */
router.put('/profile', authenticateToken, [
  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('个人简介不能超过200个字符'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('所在地不能超过100个字符'),
  body('website')
    .optional()
    .isURL()
    .withMessage('请提供有效的网站URL'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('技能必须是数组'),
  body('socialLinks')
    .optional()
    .isObject()
    .withMessage('社交链接必须是对象')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const updates = req.body;
    const userId = req.user.id;

    // 更新用户信息
    const user = await updateUserProfile(userId, updates);

    if (!user) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '用户不存在'
      });
    }

    res.json({
      code: 0,
      data: {
        user
      },
      msg: '档案更新成功'
    });

  } catch (error) {
    console.error('更新用户档案错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '更新失败，请稍后重试'
    });
  }
});

/**
 * @route   POST /api/users/avatar
 * @desc    更新用户头像
 * @access  Private
 */
router.post('/avatar', authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user.id;

    if (!avatar) {
      return res.status(400).json({
        error: '请提供头像URL'
      });
    }

    const pool = getMySQLPool();

    // 更新头像
    await pool.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatar, userId]
    );

    res.json({
      message: '头像更新成功',
      avatar
    });

  } catch (error) {
    console.error('更新头像错误:', error);
    res.status(500).json({
      error: '更新失败，请稍后重试'
    });
  }
});

/**
 * @route   GET /api/users/:username/files
 * @desc    获取用户的文件列表
 * @access  Public
 */
router.get('/:username/files', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10, category, visibility = 'public' } = req.query;

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 获取用户的文件列表
    const result = await getUserFiles(user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      visibility
    });

    res.json(result);

  } catch (error) {
    console.error('获取用户文件错误:', error);
    res.status(500).json({
      error: '获取文件列表失败'
    });
  }
});

// 添加用户活动流API端点
import { optionalAuth } from '../middleware/auth.js';

/**
 * @route   GET /api/users/:username/activity
 * @desc    获取用户活动流（包括文件上传、文章发布、图片分享等）
 * @access  Public
 */
router.get('/:username/activity', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 确保分页参数是有效的整数
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // 限制最大每页数量为100
    const offset = (pageNum - 1) * limitNum;

    console.log('活动接口参数调试:', { username, page, limit, pageNum, limitNum, offset });

    const pool = getMySQLPool();

    // 获取用户ID
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 1,
        data: null,
        msg: '用户不存在'
      });
    }

    const userId = users[0].id;

    // 确保所有参数都是整数类型
    const userIdInt = parseInt(userId);
    const limitNumInt = parseInt(limitNum);
    const offsetInt = parseInt(offset);

    console.log('查询用户活动，参数:', { userId: userIdInt, limitNum: limitNumInt, offset: offsetInt });

    // 查询用户活动（这里主要获取文件上传活动）
    // 使用字符串拼接方式处理 LIMIT 和 OFFSET，避免参数类型问题
    const query = `
      SELECT
         uf.id,
         'file_upload' as type,
         uf.title,
         uf.description,
         uf.original_name as originalName,
         uf.size,
         uf.mime_type as mimeType,
         uf.uploaded_at as uploadedAt,
         (SELECT COUNT(*) FROM file_likes fl WHERE fl.file_id = uf.id) as likeCount,
         (SELECT COUNT(*) FROM file_comments fc WHERE fc.file_id = uf.id) as commentCount,
         u.id as userId,
         u.username,
         u.avatar
       FROM user_files uf
       JOIN users u ON uf.user_id = u.id
       WHERE uf.user_id = ? AND uf.visibility = 'public'
       ORDER BY uf.uploaded_at DESC
       LIMIT ${limitNumInt} OFFSET ${offsetInt}`;

    console.log('执行的SQL查询:', query);

    const [activities] = await pool.execute(query, [userIdInt]);

    // 获取活动总数
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM user_files WHERE user_id = ? AND visibility = ?',
      [userIdInt, 'public']
    );

    res.json({
      code: 0,
      data: {
        activities,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalResult[0].total
        }
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取用户活动流错误:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      code: 1,
      data: null,
      msg: '获取活动流失败: ' + error.message
    });
  }
});

export default router;
