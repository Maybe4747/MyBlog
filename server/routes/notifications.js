import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { getMySQLPool } from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    获取用户通知列表
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getMySQLPool();

    // 确保分页参数是有效的整数
    const pageNum = Math.max(1, parseInt(req.query.page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === true;

    let sql, countSql, queryParams, countParams;

    if (unreadOnly) {
      // 只查询未读通知
      sql = 'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams = [userId, limitNum, offset];

      countSql = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND is_read = 0';
      countParams = [userId];
    } else {
      // 查询所有通知
      sql = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams = [userId, limitNum, offset];

      countSql = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
      countParams = [userId];
    }

    // 获取通知列表
    const [notifications] = await pool.query(sql, queryParams);

    // 获取总数
    const [totalResult] = await pool.query(countSql, countParams);
    const total = totalResult[0].total;

    // 获取未读数量
    const [unreadResult] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    const unreadCount = unreadResult[0].count;

    res.json({
      code: 0,
      data: {
        notifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total
        },
        unreadCount
      },
      msg: "获取成功"
    });

  } catch (error) {
    console.error('获取通知列表错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '获取通知列表失败'
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
        code: 400,
        data: {
          details: errors.array()
        },
        msg: '输入数据验证失败'
      });
    }

    const { notificationIds, markAll = false } = req.body;
    const userId = req.user.id;
    const pool = getMySQLPool();

    if (markAll) {
      // 标记所有通知为已读
      await pool.execute(
        `UPDATE notifications
         SET is_read = 1, read_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND is_read = 0`,
        [userId]
      );
    } else if (notificationIds && notificationIds.length > 0) {
      // 标记指定通知为已读
      const placeholders = notificationIds.map(() => '?').join(',');
      const params = [...notificationIds, userId];

      await pool.execute(
        `UPDATE notifications
         SET is_read = 1, read_at = CURRENT_TIMESTAMP
         WHERE id IN (${placeholders}) AND user_id = ?`,
        params
      );
    } else {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '请提供要标记的通知ID或选择标记全部'
      });
    }

    res.json({
      code: 0,
      data: {},
      msg: '标记成功'
    });

  } catch (error) {
    console.error('标记通知已读错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '标记失败'
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

    const pool = getMySQLPool();

    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '通知不存在'
      });
    }

    res.json({
      code: 0,
      data: {},
      msg: '通知删除成功'
    });

  } catch (error) {
    console.error('删除通知错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '删除通知失败'
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

    const pool = getMySQLPool();

    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    const count = result[0].count;

    res.json({
      code: 0,
      data: {
        count
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取未读通知数量错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '获取未读通知数量失败'
    });
  }
});

export default router;
