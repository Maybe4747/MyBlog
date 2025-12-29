import express from 'express';
import { getFileCategory } from '../utils/upload.js';
import { deleteFromTOS } from '../utils/tos.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { getMySQLPool } from '../config/database.js';
import { getPublicFiles, getFileById } from '../services/fileService.js';

const router = express.Router();

/**
 * @route   GET /api/files/download/:fileId
 * @desc    下载文件（重定向到TOS URL）
 * @access  Private
 */
router.get('/download/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    const pool = getMySQLPool();

    // 从数据库查询文件信息
    const [files] = await pool.execute(
      'SELECT file_url FROM user_files WHERE id = ? AND user_id = ?',
      [fileId, userId]
    );

    if (files.length === 0) {
      return res.status(404).json({
        error: '文件不存在'
      });
    }

    const fileUrl = files[0].file_url;
    if (!fileUrl) {
      return res.status(404).json({
        error: '文件URL不存在'
      });
    }

    // 重定向到TOS URL
    res.redirect(fileUrl);

    // TODO: 更新下载次数
    // await pool.execute('UPDATE user_files SET download_count = download_count + 1 WHERE id = ?', [fileId]);

  } catch (error) {
    console.error('下载文件错误:', error);
    res.status(500).json({
      error: '下载文件失败'
    });
  }
});

/**
 * @route   GET /api/files/preview/:fileId
 * @desc    预览文件（重定向到TOS URL）
 * @access  Public
 */
router.get('/preview/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.query.userId;
    const pool = getMySQLPool();

    if (!userId) {
      return res.status(400).json({
        error: '缺少用户ID参数'
      });
    }

    // 从数据库查询文件信息
    const [files] = await pool.execute(
      'SELECT file_url, visibility FROM user_files WHERE id = ? AND user_id = ?',
      [fileId, userId]
    );

    if (files.length === 0) {
      return res.status(404).json({
        error: '文件不存在'
      });
    }

    const file = files[0];
    
    // 检查文件权限
    // TODO: 根据文件可见性设置检查权限
    if (file.visibility === 'private') {
      return res.status(403).json({
        error: '文件不可访问'
      });
    }

    if (!file.file_url) {
      return res.status(404).json({
        error: '文件URL不存在'
      });
    }

    // 重定向到TOS URL
    res.redirect(file.file_url);

  } catch (error) {
    console.error('预览文件错误:', error);
    res.status(500).json({
      error: '预览文件失败'
    });
  }
});

/**
 * @route   DELETE /api/files/:fileId
 * @desc    删除文件（从TOS和数据库删除）
 * @access  Private
 */
router.delete('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    const pool = getMySQLPool();

    // 从数据库查询文件信息
    const [files] = await pool.execute(
      'SELECT file_url FROM user_files WHERE id = ? AND user_id = ?',
      [fileId, userId]
    );

    if (files.length === 0) {
      return res.status(404).json({
        error: '文件不存在或不属于当前用户'
      });
    }

    const fileUrl = files[0].file_url;

    // 从TOS删除文件
    if (fileUrl) {
      try {
        await deleteFromTOS(fileUrl);
      } catch (error) {
        console.error('从TOS删除文件失败:', error);
        // 继续删除数据库记录，即使TOS删除失败
      }
    }

    // 从数据库中删除文件记录
    await pool.execute('DELETE FROM user_files WHERE id = ?', [fileId]);

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
 * @route   GET /api/files/public
 * @desc    获取所有公开文件列表（包括当前用户的非公开文件）
 * @access  Public (可选认证)
 */
router.get('/public', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const currentUserId = req.user?.id;

    // 如果用户已登录，获取所有公开文件 + 当前用户的非公开文件
    // 如果用户未登录，只获取公开文件
    const result = await getPublicFiles({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      currentUserId // 传递当前用户ID，用于显示自己的非公开文件
    });

    res.json({
      code: 0,
      data: result,
      msg: '获取成功'
    });
  } catch (error) {
    console.error('获取公开文件列表错误:', error);
    res.status(500).json({
      code: 1,
      data: null,
      msg: '获取文件列表失败: ' + error.message
    });
  }
});

/**
 * @route   GET /api/files/:fileId
 * @desc    获取单个文件详情
 * @access  Public (可选认证)
 */
router.get('/:fileId', optionalAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const currentUserId = req.user?.id;
    const pool = getMySQLPool();

    const file = await getFileById(parseInt(fileId));

    if (!file) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '文件不存在'
      });
    }

    // 检查文件权限
    // 如果文件是私有的，只有作者本人可以查看
    if (file.visibility === 'private' && (!currentUserId || currentUserId !== file.user_id)) {
      return res.status(403).json({
        code: 403,
        data: null,
        msg: '无权访问此文件'
      });
    }

    // 如果文件是仅关注者可见，需要检查当前用户是否关注了作者
    if (file.visibility === 'followers' && currentUserId && currentUserId !== file.user_id) {
      const [follows] = await pool.execute(
        'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
        [currentUserId, file.user_id]
      );
      if (follows.length === 0) {
        return res.status(403).json({
          code: 403,
          data: null,
          msg: '无权访问此文件'
        });
      }
    }

    // 检查当前用户是否已点赞
    let liked = false;
    if (currentUserId) {
      const [likes] = await pool.execute(
        'SELECT id FROM file_likes WHERE file_id = ? AND user_id = ?',
        [fileId, currentUserId]
      );
      liked = likes.length > 0;
    }

    res.json({
      code: 0,
      data: {
        file: {
          ...file,
          liked,
          avatar: file.avatar || null
        }
      },
      msg: '获取成功'
    });
  } catch (error) {
    console.error('获取文件详情错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '获取文件详情失败: ' + error.message
    });
  }
});

export default router;
