import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { getFileCategory, deleteFile } from '../utils/upload.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @route   GET /api/files/download/:fileId
 * @desc    下载文件
 * @access  Private
 */
router.get('/download/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // TODO: 根据 fileId 查找文件信息
    // 这里需要从 MySQL 中查询

    // 示例路径
    const filePath = path.join(__dirname, '../uploads', userId.toString(), fileId);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: '文件不存在'
      });
    }

    // 发送文件
    res.download(filePath);

    // TODO: 更新下载次数
    // await Profile.updateOne(...)

  } catch (error) {
    console.error('下载文件错误:', error);
    res.status(500).json({
      error: '下载文件失败'
    });
  }
});

/**
 * @route   GET /api/files/preview/:fileId
 * @desc    预览文件
 * @access  Public
 */
router.get('/preview/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: '缺少用户ID参数'
      });
    }

    const filePath = path.join(__dirname, '../uploads', userId.toString(), fileId);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: '文件不存在'
      });
    }

    // 检查文件权限
    // TODO: 根据文件可见性设置检查权限

    res.sendFile(filePath);

  } catch (error) {
    console.error('预览文件错误:', error);
    res.status(500).json({
      error: '预览文件失败'
    });
  }
});

/**
 * @route   DELETE /api/files/:fileId
 * @desc    删除文件
 * @access  Private
 */
router.delete('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const filePath = path.join(__dirname, '../uploads', userId.toString(), fileId);

    try {
      await fs.access(filePath);
      await deleteFile(filePath);
    } catch {
      return res.status(404).json({
        error: '文件不存在'
      });
    }

    // 从数据库中删除文件记录
    // TODO: await Profile.updateOne(...)

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
