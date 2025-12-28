import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { getMySQLPool } from '../config/database.js';
import { followUser, unfollowUser, getFollowingList, getFollowersList, likeFile, unlikeFile, addFileComment, getFileComments } from '../services/socialService.js';

const router = express.Router();

/**
 * @route   POST /api/social/follow
 * @desc    关注用户
 * @access  Private
 */
router.post('/follow', authenticateToken, [
  body('userId')
    .isNumeric()
    .withMessage('用户ID必须是数字')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入数据验证失败',
        details: errors.array()
      });
    }

    const { userId: followingId } = req.body;
    const followerId = req.user.id;

    if (followerId === followingId) {
      return res.status(400).json({
        error: '不能关注自己'
      });
    }

    const pool = getMySQLPool();

    // 检查用户是否存在
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [followingId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    const success = await followUser(followerId, followingId);

    if (success) {
      res.json({
        message: '关注成功'
      });
    } else {
      res.status(400).json({
        error: '关注失败或已经关注过该用户'
      });
    }

  } catch (error) {
    console.error('关注用户错误:', error);
    res.status(500).json({
      error: '关注失败'
    });
  }
});

/**
 * @route   DELETE /api/social/follow/:userId
 * @desc    取消关注用户
 * @access  Private
 */
router.delete('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId: followingId } = req.params;
    const followerId = req.user.id;

    const success = await unfollowUser(followerId, followingId);

    if (success) {
      res.json({
        message: '取消关注成功'
      });
    } else {
      res.status(400).json({
        error: '未关注该用户'
      });
    }

  } catch (error) {
    console.error('取消关注错误:', error);
    res.status(500).json({
      error: '取消关注失败'
    });
  }
});

/**
 * @route   GET /api/social/followers/:userId
 * @desc    获取用户粉丝列表
 * @access  Public
 */
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await getFollowersList(parseInt(userId), parseInt(page), parseInt(limit));

    res.json(result);

  } catch (error) {
    console.error('获取粉丝列表错误:', error);
    res.status(500).json({
      error: '获取粉丝列表失败'
    });
  }
});

/**
 * @route   GET /api/social/following/:userId
 * @desc    获取用户关注列表
 * @access  Public
 */
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await getFollowingList(parseInt(userId), parseInt(page), parseInt(limit));

    res.json(result);

  } catch (error) {
    console.error('获取关注列表错误:', error);
    res.status(500).json({
      error: '获取关注列表失败'
    });
  }
});



/**
 * @route   POST /api/social/message
 * @desc    在用户留言板发表留言
 * @access  Private
 */
router.post('/message', authenticateToken, [
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
      // 获取留言信息
      const [newMessages] = await pool.execute(
        `SELECT m.*, u.username, u.avatar
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = ?`,
        [result.insertId]
      );

      res.json({
        message: '留言成功',
        messageRecord: {
          id: newMessages[0].id,
          userId: newMessages[0].user_id,
          profileUserId: newMessages[0].profile_user_id,
          username: newMessages[0].username,
          avatar: newMessages[0].avatar,
          content: newMessages[0].content,
          createdAt: newMessages[0].created_at
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
 * @route   GET /api/social/messages/:profileUserId
 * @desc    获取用户的留言列表
 * @access  Public
 */
router.get('/messages/:profileUserId', async (req, res) => {
  try {
    const { profileUserId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pool = getMySQLPool();

    // 获取留言列表
    const [messages] = await pool.execute(
      `SELECT m.*, u.username, u.avatar,
              (SELECT COUNT(*) FROM message_likes ml WHERE ml.message_id = m.id) AS like_count,
              (SELECT COUNT(*) FROM message_likes ml WHERE ml.message_id = m.id AND ml.user_id = ?) AS has_liked
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.profile_user_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user?.id || 0, profileUserId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
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
 * @route   DELETE /api/social/message/:messageId
 * @desc    删除留言
 * @access  Private
 */
router.delete('/message/:messageId', authenticateToken, async (req, res) => {
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

    // 删除留言
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

export default router;
