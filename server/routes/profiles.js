import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { getFileCategory, uploadMultiple, processFileUpload } from '../utils/upload.js';
import { createFile, updateFile, deleteFile, getFileById } from '../services/fileService.js';
import { likeFile, unlikeFile } from '../services/socialService.js';
import { getMySQLPool } from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/profiles/my
 * @desc    获取当前用户的档案
 * @access  Private
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getMySQLPool();

    // 获取用户的基本信息
    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.avatar, u.created_at, u.updated_at, u.last_login,
               up.bio, up.location, up.website, up.company, up.position, up.cover_image
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        data: null,
        error: '用户不存在',
        msg: '用户不存在'
      });
    }

    // 获取用户文件统计
    const [filesCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_files WHERE user_id = ?',
      [userId]
    );

    const [totalDownloads] = await pool.execute(
      'SELECT COALESCE(SUM(download_count), 0) as total FROM user_files WHERE user_id = ?',
      [userId]
    );

    // 获取关注者数量
    const [followersCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
      [userId]
    );

    // 获取关注数量（当前用户关注了多少人）
    const [followingCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
      [userId]
    );

    res.json({
      code: 0,
      data: {
        profile: {
          userId: users[0].id,
          username: users[0].username,
          email: users[0].email,
          avatar: users[0].avatar,
          bio: users[0].bio,
          location: users[0].location,
          website: users[0].website,
          coverImage: users[0].cover_image || null,
          company: users[0].company,
          position: users[0].position,
          createdAt: users[0].created_at,
          totalFiles: filesCount[0].count,
          totalDownloads: totalDownloads[0].total,
          followerCount: followersCount[0].count,
          followingCount: followingCount[0].count
        }
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取用户档案错误:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      code: 500,
      data: null,
      error: '获取档案失败',
      msg: error.message || '获取档案失败'
    });
  }
});

/**
 * @route   POST /api/profiles/files
 * @desc    添加文件到档案
 * @access  Private
 */
router.post('/files', authenticateToken, uploadMultiple('file'), [
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

    const { title, description, visibility = 'public', tags = [] } = req.body;
    const userId = req.user.id;

    if (!req.files || !req.files.length) {
      return res.status(400).json({
        error: '请上传文件'
      });
    }

    const file = req.files[0];
    const category = getFileCategory(file.mimetype);

    // 上传文件到TOS或本地存储，获取URL
    const fileUrl = await processFileUpload(file, userId, 'file');

    // 创建文件记录
    const fileData = {
      userId,
      filename: file.filename || file.originalname, // 保留原始文件名用于显示
      fileUrl: fileUrl, // 存储文件URL
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      category,
      title,
      description,
      tags: Array.isArray(tags) ? tags : [],
      visibility
    };

    const createdFile = await createFile(fileData);

    res.status(201).json({
      message: '文件添加成功',
      file: createdFile
    });

  } catch (error) {
    console.error('添加文件错误:', error);
    res.status(500).json({
      error: '添加文件失败: ' + error.message
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

    // 验证文件是否属于当前用户
    const pool = getMySQLPool();
    const [files] = await pool.execute(
      'SELECT id FROM user_files WHERE id = ? AND user_id = ?',
      [fileId, userId]
    );

    if (files.length === 0) {
      return res.status(404).json({
        error: '文件不存在或不属于当前用户'
      });
    }

    const updatedFile = await updateFile(fileId, updates);

    res.json({
      message: '文件更新成功',
      file: updatedFile
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

    const success = await deleteFile(fileId, userId);

    if (!success) {
      return res.status(404).json({
        error: '文件不存在或不属于当前用户'
      });
    }

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

    // 获取文件信息
    const file = await getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '文件不存在'
      });
    }

    // 添加点赞
    const success = await likeFile(userId, fileId);

    if (success) {
      res.json({
        code: 0,
        data: { liked: true },
        msg: '点赞成功'
      });
    } else {
      res.status(500).json({
        code: 500,
        data: null,
        msg: '点赞失败'
      });
    }

  } catch (error) {
    console.error('点赞错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '点赞失败: ' + error.message
    });
  }
});

/**
 * @route   DELETE /api/profiles/files/:fileId/like
 * @desc    取消点赞文件
 * @access  Private
 */
router.delete('/files/:fileId/like', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // 获取文件信息
    const file = await getFileById(fileId);
    if (!file) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '文件不存在'
      });
    }

    // 取消点赞
    const success = await unlikeFile(userId, fileId);

    if (success) {
      res.json({
        code: 0,
        data: { liked: false },
        msg: '取消点赞成功'
      });
    } else {
      res.status(500).json({
        code: 500,
        data: null,
        msg: '取消点赞失败'
      });
    }

  } catch (error) {
    console.error('取消点赞错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '取消点赞失败: ' + error.message
    });
  }
});

export default router;
