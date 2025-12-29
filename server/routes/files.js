import express from 'express';
import { getFileCategory } from '../utils/upload.js';
import { deleteFromTOS } from '../utils/tos.js';
import { authenticateToken } from '../middleware/auth.js';
import { getMySQLPool } from '../config/database.js';

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

export default router;
