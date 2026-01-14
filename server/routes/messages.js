import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { getMySQLPool } from '../config/database.js';
import { createNotification } from '../utils/notificationHelper.js';

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

    // 确保分页参数是整数类型
    const limitNum = parseInt(limit) || 10;
    const pageNum = parseInt(page) || 1;
    const offsetNum = (pageNum - 1) * limitNum;
    const limitInt = Number(limitNum);
    const offsetInt = Number(offsetNum);
    const currentUserId = req.user?.id || 0;

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
       LIMIT ${limitInt} OFFSET ${offsetInt}`,
      [currentUserId, currentUserId, profileUserId]
    );

    // 获取留言总数
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM messages WHERE profile_user_id = ?',
      [profileUserId]
    );

    // 格式化留言数据
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      userId: msg.user_id,
      profileUserId: msg.profile_user_id,
      username: msg.username,
      avatar: msg.avatar,
      content: msg.content,
      likeCount: msg.like_count || 0,
      isLiked: (msg.has_liked || 0) > 0,
      createdAt: msg.created_at,
      created_at: msg.created_at // 保留原字段以兼容
    }));

    res.json({
      code: 0,
      data: {
        messages: formattedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalResult[0].total
        }
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取留言列表错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '获取留言列表失败',
      msg: error.message || '获取留言列表失败'
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

      const messageData = newMessage[0];

      // 创建通知（目标用户不是留言者本人）
      if (profileUserId !== userId && messageData) {
        const contentPreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
        await createNotification(
          profileUserId,
          'message',
          '新的留言',
          `${messageData.username || '某用户'} 给你留言: "${contentPreview}"`,
          userId,
          messageData.username,
          'message',
          result.insertId
        );
      }

      res.status(201).json({
        message: '留言成功',
        messageRecord: {
          id: messageData.id,
          userId: messageData.user_id,
          profileUserId: messageData.profile_user_id,
          username: messageData.username,
          avatar: messageData.avatar,
          content: messageData.content,
          createdAt: messageData.created_at
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
        code: 404,
        data: null,
        error: '留言不存在',
        msg: '留言不存在'
      });
    }

    const messageUserId = messages[0].user_id;

    // 检查是否已点赞
    const [existing] = await pool.execute(
      'SELECT id FROM message_likes WHERE message_id = ? AND user_id = ?',
      [messageId, userId]
    );

    if (existing.length > 0) {
      // 已经点赞，返回成功但不重复点赞
      const [likes] = await pool.execute(
        'SELECT COUNT(*) as count FROM message_likes WHERE message_id = ?',
        [messageId]
      );
      
      return res.json({
        code: 0,
        data: {
          liked: true,
          likeCount: likes[0].count
        },
        msg: '已点赞'
      });
    }

    // 点赞留言
    await pool.execute(
      `INSERT INTO message_likes (message_id, user_id) 
       VALUES (?, ?)`,
      [messageId, userId]
    );

    // 获取最新的点赞数
    const [likes] = await pool.execute(
      'SELECT COUNT(*) as count FROM message_likes WHERE message_id = ?',
      [messageId]
    );

    res.json({
      code: 0,
      data: {
        liked: true,
        likeCount: likes[0].count
      },
      msg: '留言点赞成功'
    });

  } catch (error) {
    console.error('留言点赞错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '留言点赞失败',
      msg: error.message || '留言点赞失败'
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
        code: 404,
        data: null,
        error: '留言不存在',
        msg: '留言不存在'
      });
    }

    // 取消点赞
    const [result] = await pool.execute(
      'DELETE FROM message_likes WHERE message_id = ? AND user_id = ?',
      [messageId, userId]
    );

    if (result.affectedRows > 0) {
      // 获取最新的点赞数
      const [likes] = await pool.execute(
        'SELECT COUNT(*) as count FROM message_likes WHERE message_id = ?',
        [messageId]
      );

      res.json({
        code: 0,
        data: {
          liked: false,
          likeCount: likes[0].count
        },
        msg: '取消点赞成功'
      });
    } else {
      res.status(400).json({
        code: 400,
        data: null,
        error: '未对该留言进行点赞',
        msg: '未对该留言进行点赞'
      });
    }

  } catch (error) {
    console.error('取消留言点赞错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '取消留言点赞失败',
      msg: error.message || '取消留言点赞失败'
    });
  }
});

export default router;