import express from 'express';
import { body, validationResult } from 'express-validator';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { getFileCategory, generateFileUrl } from '../utils/upload.js';

const router = express.Router();

/**
 * @route   GET /api/profiles/my
 * @desc    获取当前用户的档案
 * @access  Private
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let profile = await Profile.findOne({ userId });

    if (!profile) {
      // 如果档案不存在，创建一个
      profile = await Profile.create({ userId });
    }

    res.json({
      profile: {
        ...profile.toObject(),
        totalFiles: profile.files.length,
        totalLikes: profile.files.reduce((sum, file) => sum + file.likes.length, 0)
      }
    });

  } catch (error) {
    console.error('获取用户档案错误:', error);
    res.status(500).json({
      error: '获取档案失败'
    });
  }
});

/**
 * @route   POST /api/profiles/files
 * @desc    添加文件到档案
 * @access  Private
 */
router.post('/files', authenticateToken, [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('请输入文件标题')
    .isLength({ max: 100 })
    .withMessage('标题不能超过100个字符'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符'),
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('可见性设置无效'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const { title, description, visibility = 'public', tags = [], filename } = req.body;
    const userId = req.user.id;

    if (!req.files || !req.files.length) {
      return res.status(400).json({
        error: '请上传文件'
      });
    }

    const file = req.files[0];
    const category = getFileCategory(file.mimetype);

    // 创建文件记录
    const fileRecord = {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      category,
      title,
      description,
      tags,
      visibility
    };

    // 查找或创建用户档案
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      profile = new Profile({
        userId,
        files: [fileRecord]
      });
    } else {
      profile.files.push(fileRecord);
    }

    await profile.save();

    res.status(201).json({
      message: '文件添加成功',
      file: profile.files[profile.files.length - 1]
    });

  } catch (error) {
    console.error('添加文件错误:', error);
    res.status(500).json({
      error: '添加文件失败'
    });
  }
});

/**
 * @route   PUT /api/profiles/files/:fileId
 * @desc    更新文件信息
 * @access  Private
 */
router.put('/files/:fileId', authenticateToken, [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('标题不能超过100个字符'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符'),
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('可见性设置无效'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const { fileId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        error: '档案不存在'
      });
    }

    const file = profile.files.id(fileId);

    if (!file) {
      return res.status(404).json({
        error: '文件不存在'
      });
    }

    // 更新文件信息
    Object.assign(file, updates);
    await profile.save();

    res.json({
      message: '文件更新成功',
      file
    });

  } catch (error) {
    console.error('更新文件错误:', error);
    res.status(500).json({
      error: '更新文件失败'
    });
  }
});

/**
 * @route   DELETE /api/profiles/files/:fileId
 * @desc    删除文件
 * @access  Private
 */
router.delete('/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        error: '档案不存在'
      });
    }

    const file = profile.files.id(fileId);

    if (!file) {
      return res.status(404).json({
        error: '文件不存在'
      });
    }

    // 删除文件记录
    file.remove();
    await profile.save();

    res.json({
      message: '文件删除成功'
    });

  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({
      error: '删除文件失败'
    });
  }
});

/**
 * @route   POST /api/profiles/files/:fileId/like
 * @desc    点赞文件
 * @access  Private
 */
router.post('/files/:fileId/like', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // 获取文件拥有者
    const [owners] = await getMySQLPool().execute(
      'SELECT p.userId FROM profiles p JOIN profiles.files f ON f._id = ? WHERE p.userId',
      [fileId]
    );

    if (owners.length === 0) {
      return res.status(404).json({
        error: '文件不存在'
      });
    }

    const ownerId = owners[0].userId;

    // 如果是自己点赞
    if (ownerId === userId) {
      return res.status(400).json({
        error: '不能给自己的文件点赞'
      });
    }

    // TODO: 查找并更新文件
    // 这里需要根据实际的MongoDB文档结构来操作

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

export default router;
