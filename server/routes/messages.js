import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { getMySQLPool } from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/messages/:profileUserId
 * @desc    获取指定用户的留言列表
 * @access  Public
 */
router.get('/:profileUserId', async (req, res) => {
  try {
    const { profileUserId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pool = getMySQLPool();

    // 获取留言列表
    const [messages] = await pool.execute(
      `SELECT m.*, u.username, u.avatar,
              (SELECT COUNT(*) FROM message_likes ml WHERE ml.message_id = m.id) AS like_count,
              CASE WHEN ? != 0 THEN
                (SELECT COUNT(*) FROM message_likes ml WHERE ml.message_id = m.id AND ml.user_id = ?)
              ELSE 0 END AS has_liked
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.profile_user_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user?.id || 0, req.user?.id || 0, profileUserId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
    );

    // 获取留言总数
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM messages WHERE profile_user_id = ?',
      [profileUserId]
    );

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total
      }
    });

  } catch (error) {
    console.error('获取留言列表错误:', error);
    res.status(500).json({
      error: '获取留言列表失败'
    });
  }
});

/**
 * @route   POST /api/messages
 * @desc    在用户留言板发表留言
 * @access  Private
 */
router.post('/', authenticateToken, [
  body('profileUserId')
    .trim()
    .isNumeric()
    .withMessage('请提供有效的用户ID'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('留言内容不能为空')
    .isLength({ max: 500 })
    .withMessage('留言内容不能超过500个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const { profileUserId, content } = req.body;
    const userId = req.user.id;

    // 获取目标用户信息
    const pool = getMySQLPool();
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [profileUserId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 检查是否是给自己留言
    if (profileUserId === userId) {
      return res.status(400).json({
        error: '不允许给自己留言'
      });
    }

    // 添加留言
    const [result] = await pool.execute(
      `INSERT INTO messages (user_id, profile_user_id, content) 
       VALUES (?, ?, ?)`,
      [userId, profileUserId, content]
    );

    if (result.insertId) {
      // 获取新增的留言信息
      const [newMessage] = await pool.execute(
        `SELECT m.*, u.username, u.avatar
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        message: '留言成功',
        messageRecord: {
          id: newMessage[0].id,
          userId: newMessage[0].user_id,
          profileUserId: newMessage[0].profile_user_id,
          username: newMessage[0].username,
          avatar: newMessage[0].avatar,
          content: newMessage[0].content,
          createdAt: newMessage[0].created_at
        }
      });
    } else {
      res.status(500).json({
        error: '留言失败'
      });
    }

  } catch (error) {
    console.error('发表留言错误:', error);
    res.status(500).json({
      error: '留言失败'
    });
  }
});

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    删除留言
 * @access  Private
 */
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const pool = getMySQLPool();

    // 获取留言信息
    const [messages] = await pool.execute(
      'SELECT user_id, profile_user_id FROM messages WHERE id = ?',
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        error: '留言不存在'
      });
    }

    const message = messages[0];
    
    // 检查权限：只有留言者或目标用户可以删除留言
    if (message.user_id !== userId && message.profile_user_id !== userId) {
      return res.status(403).json({
        error: '无权删除此留言'
      });
    }

    // 删除留言及其关联的点赞
    await pool.execute(
      'DELETE FROM messages WHERE id = ?',
      [messageId]
    );

    res.json({
      message: '留言删除成功'
    });

  } catch (error) {
    console.error('删除留言错误:', error);
    res.status(500).json({
      error: '删除留言失败'
    });
  }
});

/**
 * @route   POST /api/messages/:messageId/like
 * @desc    点赞留言
 * @access  Private
 */
router.post('/:messageId/like', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const pool = getMySQLPool();

    // 获取留言信息
    const [messages] = await pool.execute(
      'SELECT user_id FROM messages WHERE id = ?',
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        error: '留言不存在'
      });
    }

    const messageUserId = messages[0].user_id;

    // 检查是否是自己点赞自己的留言
    if (messageUserId === userId) {
      return res.status(400).json({
        error: '不能给自己的留言点赞'
      });
    }

    // 点赞留言
    const [result] = await pool.execute(
      `INSERT INTO message_likes (message_id, user_id) 
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
      [messageId, userId]
    );

    res.json({
      message: '留言点赞成功'
    });

  } catch (error) {
    console.error('留言点赞错误:', error);
    res.status(500).json({
      error: '留言点赞失败'
    });
  }
});

/**
 * @route   POST /api/messages/:messageId/like
 * @desc    点赞留言
 * @access  Private
 */
router.post('/:messageId/like', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const pool = getMySQLPool();

    // 获取留言信息
    const [messages] = await pool.execute(
      'SELECT user_id FROM messages WHERE id = ?',
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        error: '留言不存在'
      });
    }

    const messageUserId = messages[0].user_id;

    // 检查是否是自己点赞自己的留言
    if (messageUserId === userId) {
      return res.status(400).json({
        error: '不能给自己的留言点赞'
      });
    }

    // 点赞留言
    const [result] = await pool.execute(
      `INSERT INTO message_likes (message_id, user_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
      [messageId, userId]
    );

    res.json({
      message: '留言点赞成功'
    });

  } catch (error) {
    console.error('留言点赞错误:', error);
    res.status(500).json({
      error: '留言点赞失败'
    });
  }
});

/**
 * @route   DELETE /api/messages/:messageId/like
 * @desc    取消留言点赞
 * @access  Private
 */
router.delete('/:messageId/like', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const pool = getMySQLPool();

    // 检查留言是否存在
    const [messages] = await pool.execute(
      'SELECT id FROM messages WHERE id = ?',
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        error: '留言不存在'
      });
    }

    // 取消点赞
    const [result] = await pool.execute(
      'DELETE FROM message_likes WHERE message_id = ? AND user_id = ?',
      [messageId, userId]
    );

    if (result.affectedRows > 0) {
      res.json({
        message: '取消点赞成功'
      });
    } else {
      res.status(400).json({
        error: '未对该留言进行点赞'
      });
    }

  } catch (error) {
    console.error('取消留言点赞错误:', error);
    res.status(500).json({
      error: '取消留言点赞失败'
    });
  }
});

export default router;