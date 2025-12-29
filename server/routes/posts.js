import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { uploadMultiple, processFileUpload } from '../utils/upload.js';
import { 
  createPost, 
  getPosts, 
  getPostById, 
  updatePost, 
  deletePost,
  togglePostLike 
} from '../services/postService.js';

const router = express.Router();

/**
 * @route   POST /api/posts
 * @desc    创建帖子
 * @access  Private
 */
router.post('/', authenticateToken, uploadMultiple('image'), [
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('内容不能超过2000个字符'),
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('可见性设置无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        data: null,
        error: '输入数据验证失败',
        details: errors.array(),
        msg: '输入数据验证失败'
      });
    }

    const { content, visibility = 'public' } = req.body;
    const userId = req.user.id;

    // 如果有图片或视频，上传到TOS
    let imageUrl = null;
    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      imageUrl = await processFileUpload(file, userId, 'file');
    }

    // 如果没有内容和媒体文件，返回错误
    if (!content?.trim() && !imageUrl) {
      return res.status(400).json({
        code: 400,
        data: null,
        error: '帖子内容或媒体文件至少需要一项',
        msg: '帖子内容或媒体文件至少需要一项'
      });
    }

    const postData = {
      userId,
      content: content?.trim() || null,
      imageUrl,
      visibility
    };

    const post = await createPost(postData);

    if (!post) {
      return res.status(500).json({
        code: 500,
        data: null,
        error: '创建帖子失败',
        msg: '创建帖子失败'
      });
    }

    res.status(201).json({
      code: 0,
      data: {
        post
      },
      msg: '帖子创建成功'
    });

  } catch (error) {
    console.error('创建帖子错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '创建帖子失败: ' + error.message,
      msg: error.message || '创建帖子失败'
    });
  }
});

/**
 * @route   GET /api/posts
 * @desc    获取帖子列表
 * @access  Public (可选认证)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      userId, 
      page = 1, 
      limit = 20, 
      visibility = 'public' 
    } = req.query;

    const currentUserId = req.user?.id || null;

    const result = await getPosts({
      userId: userId ? parseInt(userId) : null,
      page: parseInt(page),
      limit: parseInt(limit),
      visibility,
      currentUserId
    });

    res.json({
      code: 0,
      data: result,
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '获取帖子列表失败',
      msg: error.message || '获取帖子列表失败'
    });
  }
});

/**
 * @route   GET /api/posts/:postId
 * @desc    获取单个帖子
 * @access  Public (可选认证)
 */
router.get('/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user?.id || null;

    const post = await getPostById(parseInt(postId), currentUserId);

    if (!post) {
      return res.status(404).json({
        code: 404,
        data: null,
        error: '帖子不存在',
        msg: '帖子不存在'
      });
    }

    res.json({
      code: 0,
      data: {
        post
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取帖子错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '获取帖子失败',
      msg: error.message || '获取帖子失败'
    });
  }
});

/**
 * @route   PUT /api/posts/:postId
 * @desc    更新帖子
 * @access  Private
 */
router.put('/:postId', authenticateToken, uploadMultiple('image'), [
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('内容不能超过2000个字符'),
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('可见性设置无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        data: null,
        error: '输入数据验证失败',
        details: errors.array(),
        msg: '输入数据验证失败'
      });
    }

    const { postId } = req.params;
    const userId = req.user.id;
    const { content, visibility } = req.body;

    const updateData = {};
    if (content !== undefined) {
      updateData.content = content.trim() || null;
    }
    if (visibility !== undefined) {
      updateData.visibility = visibility;
    }

    // 如果有新图片，上传到TOS
    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      updateData.imageUrl = await processFileUpload(file, userId, 'file');
    }

    const post = await updatePost(parseInt(postId), userId, updateData);

    if (!post) {
      return res.status(404).json({
        code: 404,
        data: null,
        error: '帖子不存在或无权修改',
        msg: '帖子不存在或无权修改'
      });
    }

    res.json({
      code: 0,
      data: {
        post
      },
      msg: '更新成功'
    });

  } catch (error) {
    console.error('更新帖子错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '更新帖子失败',
      msg: error.message || '更新帖子失败'
    });
  }
});

/**
 * @route   DELETE /api/posts/:postId
 * @desc    删除帖子
 * @access  Private
 */
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const success = await deletePost(parseInt(postId), userId);

    if (!success) {
      return res.status(404).json({
        code: 404,
        data: null,
        error: '帖子不存在或无权删除',
        msg: '帖子不存在或无权删除'
      });
    }

    res.json({
      code: 0,
      data: null,
      msg: '删除成功'
    });

  } catch (error) {
    console.error('删除帖子错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '删除帖子失败',
      msg: error.message || '删除帖子失败'
    });
  }
});

/**
 * @route   POST /api/posts/:postId/like
 * @desc    点赞/取消点赞帖子
 * @access  Private
 */
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const result = await togglePostLike(parseInt(postId), userId);

    res.json({
      code: 0,
      data: result,
      msg: result.liked ? '点赞成功' : '取消点赞成功'
    });

  } catch (error) {
    console.error('点赞帖子错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '操作失败',
      msg: error.message || '操作失败'
    });
  }
});

export default router;

