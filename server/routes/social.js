import express from 'express';
import { body, validationResult } from 'express-validator';
import Follow from '../models/Follow.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { authenticateToken } from '../middleware/auth.js';
import { getMySQLPool } from '../config/database.js';

const router = express.Router();

/**
 * @route   POST /api/social/follow
 * @desc    关注用户
 * @access  Private
 */
router.post('/follow', authenticateToken, [
  body('userId')
    .isNumeric()
    .withMessage('用户ID必须是数字')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const { userId: followingId } = req.body;
    const followerId = req.user.id;

    if (followerId === followingId) {
      return res.status(400).json({
        error: '不能关注自己'
      });
    }

    const pool = getMySQLPool();

    // 检查用户是否存在
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [followingId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 检查是否已关注
    const existingFollow = await Follow.findOne({
      followerId,
      followingId
    });

    if (existingFollow) {
      return res.status(400).json({
        error: '已经关注过该用户'
      });
    }

    // 创建关注关系
    await Follow.create({
      followerId,
      followingId
    });

    // 更新关注者数量
    const profile = await Profile.findOne({ userId: followingId });
    if (profile) {
      profile.followerCount += 1;
      await profile.save();
    }

    res.json({
      message: '关注成功'
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: '已经关注过该用户'
      });
    }
    console.error('关注用户错误:', error);
    res.status(500).json({
      error: '关注失败'
    });
  }
});

/**
 * @route   DELETE /api/social/follow/:userId
 * @desc    取消关注用户
 * @access  Private
 */
router.delete('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId: followingId } = req.params;
    const followerId = req.user.id;

    const result = await Follow.deleteOne({
      followerId,
      followingId: parseInt(followingId)
    });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        error: '未关注该用户'
      });
    }

    // 更新关注者数量
    const profile = await Profile.findOne({ userId: parseInt(followingId) });
    if (profile && profile.followerCount > 0) {
      profile.followerCount -= 1;
      await profile.save();
    }

    res.json({
      message: '取消关注成功'
    });

  } catch (error) {
    console.error('取消关注错误:', error);
    res.status(500).json({
      error: '取消关注失败'
    });
  }
});

/**
 * @route   GET /api/social/followers/:userId
 * @desc    获取用户粉丝列表
 * @access  Public
 */
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const followers = await Follow.find({ followingId: parseInt(userId) })
      .populate('followerId')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Follow.countDocuments({ followingId: parseInt(userId) });

    res.json({
      followers: followers.map(f => ({
        userId: f.followerId,
        username: f.followerId.username,
        avatar: f.followerId.avatar,
        bio: f.followerId.bio
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });

  } catch (error) {
    console.error('获取粉丝列表错误:', error);
    res.status(500).json({
      error: '获取粉丝列表失败'
    });
  }
});

/**
 * @route   GET /api/social/following/:userId
 * @desc    获取用户关注列表
 * @access  Public
 */
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const following = await Follow.find({ followerId: parseInt(userId) })
      .populate('followingId')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Follow.countDocuments({ followerId: parseInt(userId) });

    res.json({
      following: following.map(f => ({
        userId: f.followingId,
        username: f.followingId.username,
        avatar: f.followingId.avatar,
        bio: f.followingId.bio
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });

  } catch (error) {
    console.error('获取关注列表错误:', error);
    res.status(500).json({
      error: '获取关注列表失败'
    });
  }
});

/**
 * @route   POST /api/social/like
 * @desc    点赞文件
 * @access  Private
 */
router.post('/like', authenticateToken, [
  body('fileId')
    .notEmpty()
    .withMessage('请提供文件ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const { fileId } = req.body;
    const userId = req.user.id;

    // TODO: 在 MongoDB 中查找并更新文件点赞
    // 这里需要根据实际文档结构实现

    res.json({
      message: '点赞成功'
    });

  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({
      error: '点赞失败'
    });
  }
});

/**
 * @route   DELETE /api/social/like/:fileId
 * @desc    取消点赞
 * @access  Private
 */
router.delete('/like/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // TODO: 在 MongoDB 中取消点赞

    res.json({
      message: '取消点赞成功'
    });

  } catch (error) {
    console.error('取消点赞错误:', error);
    res.status(500).json({
      error: '取消点赞失败'
    });
  }
});

/**
 * @route   POST /api/social/comment
 * @desc    发表评论
 * @access  Private
 */
router.post('/comment', authenticateToken, [
  body('fileId')
    .notEmpty()
    .withMessage('请提供文件ID'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('评论内容不能为空')
    .isLength({ max: 500 })
    .withMessage('评论内容不能超过500个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const { fileId, content } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    // TODO: 在 MongoDB 中添加评论

    res.json({
      message: '评论成功',
      comment: {
        userId,
        username,
        content,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('发表评论错误:', error);
    res.status(500).json({
      error: '评论失败'
    });
  }
});

export default router;
