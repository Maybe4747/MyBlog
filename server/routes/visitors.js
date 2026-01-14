import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { recordVisit, getTodayVisitorCount, getTotalVisitorCount } from '../services/visitorService.js';

const router = express.Router();

/**
 * @route   POST /api/visitors/record
 * @desc    记录访客访问
 * @access  Public (可选认证)
 */
router.post('/record', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    const visitorId = req.user?.id || null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;

    if (!userId) {
      return res.status(400).json({
        code: 400,
        data: null,
        error: '用户ID不能为空',
        msg: '用户ID不能为空'
      });
    }

    // 不记录自己访问自己
    if (visitorId && parseInt(visitorId) === parseInt(userId)) {
      return res.json({
        code: 0,
        data: { recorded: false },
        msg: '不记录自己访问自己'
      });
    }

    const success = await recordVisit(parseInt(userId), visitorId, ipAddress, userAgent);

    if (success) {
      res.json({
        code: 0,
        data: { recorded: true },
        msg: '记录成功'
      });
    } else {
      res.status(500).json({
        code: 500,
        data: null,
        error: '记录失败',
        msg: '记录失败'
      });
    }

  } catch (error) {
    console.error('记录访客访问错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '记录失败',
      msg: error.message || '记录失败'
    });
  }
});

/**
 * @route   GET /api/visitors/today/:userId
 * @desc    获取今日访客数
 * @access  Public
 */
router.get('/today/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await getTodayVisitorCount(parseInt(userId));

    res.json({
      code: 0,
      data: { count },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取今日访客数错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '获取失败',
      msg: error.message || '获取失败'
    });
  }
});

/**
 * @route   GET /api/visitors/total/:userId
 * @desc    获取总访客数
 * @access  Public
 */
router.get('/total/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await getTotalVisitorCount(parseInt(userId));

    res.json({
      code: 0,
      data: { count },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取总访客数错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '获取失败',
      msg: error.message || '获取失败'
    });
  }
});

export default router;

