import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
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

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 获取用户档案
    const profile = await Profile.findOne({ userId: user.userId });

    res.json({
      user: {
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        skills: user.skills,
        socialLinks: user.socialLinks,
        isActive: user.isActive
      },
      stats: {
        followers: profile?.followerCount || 0,
        files: profile?.files?.length || 0,
        views: profile?.totalViews || 0
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
    .withMessage('技能必须是数组')
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
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    res.json({
      message: '档案更新成功',
      user
    });

  } catch (error) {
    console.error('更新用户档案错误:', error);
    res.status(500).json({
      error: '更新失败，请稍后重试'
    });
  }
});

/**
 * @route   POST /api/users/avatar
 * @desc    上传用户头像
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

    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { avatar } },
      { new: true }
    );

    res.json({
      message: '头像更新成功',
      avatar: user.avatar
    });

  } catch (error) {
    console.error('上传头像错误:', error);
    res.status(500).json({
      error: '上传失败，请稍后重试'
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

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    const profile = await Profile.findOne({ userId: user.userId });

    if (!profile) {
      return res.json({
        files: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0
        }
      });
    }

    // 过滤文件
    let files = profile.files;

    // 按可见性过滤
    files = files.filter(f => f.visibility === 'public');

    // 按分类过滤
    if (category) {
      files = files.filter(f => f.category === category);
    }

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedFiles = files.slice(skip, skip + parseInt(limit));

    res.json({
      files: paginatedFiles.map(file => ({
        ...file.toObject(),
        likeCount: file.likes.length,
        commentCount: file.comments.length
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: files.length
      }
    });

  } catch (error) {
    console.error('获取用户文件错误:', error);
    res.status(500).json({
      error: '获取文件列表失败'
    });
  }
});

export default router;
