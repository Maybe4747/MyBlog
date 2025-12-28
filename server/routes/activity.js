import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { getMySQLPool } from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/activity/:username
 * @desc    获取用户活动流（包括文件上传、文章发布、图片分享等）
 * @access  Public
 */
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

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

    // 查询用户活动（这里主要获取文件上传活动）
    const [activities] = await pool.execute(
      `SELECT 
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
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
    );

    // 获取活动总数
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM user_files WHERE user_id = ? AND visibility = \'public\'',
      [userId]
    );

    res.json({
      code: 0,
      data: {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalResult[0].total
        }
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取用户活动流错误:', error);
    res.status(500).json({
      code: 1,
      data: null,
      msg: '获取活动流失败'
    });
  }
});

export default router;