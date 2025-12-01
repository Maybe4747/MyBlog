import express from 'express';
import { body, validationResult } from 'express-validator';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    获取用户通知列表
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (unreadOnly === 'true' || unreadOnly === true) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      },
      unreadCount
    });

  } catch (error) {
    console.error('获取通知列表错误:', error);
    res.status(500).json({
      error: '获取通知列表失败'
    });
  }
});

/**
 * @route   POST /api/notifications/mark-read
 * @desc    标记通知为已读
 * @access  Private
 */
router.post('/mark-read', authenticateToken, [
  body('notificationIds')
    .optional()
    .isArray()
    .withMessage('通知ID必须是数组'),
  body('markAll')
    .optional()
    .isBoolean()
    .withMessage('markAll必须是布尔值')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const { notificationIds, markAll = false } = req.body;
    const userId = req.user.id;

    if (markAll) {
      // 标记所有通知为已读
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } else if (notificationIds && notificationIds.length > 0) {
      // 标记指定通知为已读
      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          userId
        },
        { isRead: true, readAt: new Date() }
      );
    } else {
      return res.status(400).json({
        error: '请提供要标记的通知ID或选择标记全部'
      });
    }

    res.json({
      message: '标记成功'
    });

  } catch (error) {
    console.error('标记通知已读错误:', error);
    res.status(500).json({
      error: '标记失败'
    });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    删除通知
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await Notification.deleteOne({
      _id: id,
      userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: '通知不存在'
      });
    }

    res.json({
      message: '通知删除成功'
    });

  } catch (error) {
    console.error('删除通知错误:', error);
    res.status(500).json({
      error: '删除通知失败'
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    获取未读通知数量
 * @access  Private
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.json({ count });

  } catch (error) {
    console.error('获取未读通知数量错误:', error);
    res.status(500).json({
      error: '获取未读通知数量失败'
    });
  }
});

export default router;
