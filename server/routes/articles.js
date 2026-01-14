import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { 
  createArticle, 
  getArticles, 
  getArticleById, 
  updateArticle, 
  deleteArticle,
  toggleArticleLike,
  addArticleComment,
  getArticleComments,
  deleteArticleComment
} from '../services/articleService.js';

const router = express.Router();

/**
 * @route   POST /api/articles
 * @desc    创建文章
 * @access  Private
 */
router.post('/', authenticateToken, [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('文章标题不能为空')
    .isLength({ max: 200 })
    .withMessage('标题不能超过200个字符'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('文章内容不能为空')
    .isLength({ min: 10 })
    .withMessage('文章内容至少需要10个字符'),
  body('summary')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('摘要不能超过500个字符'),
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

    const { title, summary, content, visibility = 'public' } = req.body;
    const userId = req.user.id;

    const articleData = {
      userId,
      title: title.trim(),
      summary: summary?.trim() || null,
      content: content.trim(),
      visibility
    };

    const article = await createArticle(articleData);

    if (!article) {
      return res.status(500).json({
        code: 500,
        data: null,
        error: '创建文章失败',
        msg: '创建文章失败'
      });
    }

    res.status(201).json({
      code: 0,
      data: {
        article
      },
      msg: '文章创建成功'
    });

  } catch (error) {
    console.error('创建文章错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '创建文章失败: ' + error.message,
      msg: error.message || '创建文章失败'
    });
  }
});

/**
 * @route   GET /api/articles
 * @desc    获取文章列表
 * @access  Public (可选认证)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      userId, 
      page = 1, 
      limit = 20, 
      visibility = 'public',
      search
    } = req.query;

    const currentUserId = req.user?.id || null;

    const result = await getArticles({
      userId: userId ? parseInt(userId) : null,
      page: parseInt(page),
      limit: parseInt(limit),
      visibility,
      currentUserId,
      search: search || null
    });

    res.json({
      code: 0,
      data: result,
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取文章列表错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '获取文章列表失败',
      msg: error.message || '获取文章列表失败'
    });
  }
});

/**
 * @route   GET /api/articles/:articleId
 * @desc    获取单个文章
 * @access  Public (可选认证)
 */
router.get('/:articleId', optionalAuth, async (req, res) => {
  try {
    const { articleId } = req.params;
    const currentUserId = req.user?.id || null;

    const article = await getArticleById(parseInt(articleId), currentUserId);

    if (!article) {
      return res.status(404).json({
        code: 404,
        data: null,
        error: '文章不存在',
        msg: '文章不存在'
      });
    }

    res.json({
      code: 0,
      data: {
        article
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取文章错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '获取文章失败',
      msg: error.message || '获取文章失败'
    });
  }
});

/**
 * @route   PUT /api/articles/:articleId
 * @desc    更新文章
 * @access  Private
 */
router.put('/:articleId', authenticateToken, [
  body('title')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('标题不能超过200个字符'),
  body('content')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 10 })
    .withMessage('文章内容至少需要10个字符'),
  body('summary')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('摘要不能超过500个字符'),
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

    const { articleId } = req.params;
    const userId = req.user.id;
    const { title, summary, content, visibility } = req.body;

    const updateData = {};
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (summary !== undefined) {
      updateData.summary = summary?.trim() || null;
    }
    if (content !== undefined) {
      updateData.content = content.trim();
    }
    if (visibility !== undefined) {
      updateData.visibility = visibility;
    }

    const article = await updateArticle(parseInt(articleId), userId, updateData);

    if (!article) {
      return res.status(404).json({
        code: 404,
        data: null,
        error: '文章不存在或无权修改',
        msg: '文章不存在或无权修改'
      });
    }

    res.json({
      code: 0,
      data: {
        article
      },
      msg: '更新成功'
    });

  } catch (error) {
    console.error('更新文章错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '更新文章失败',
      msg: error.message || '更新文章失败'
    });
  }
});

/**
 * @route   DELETE /api/articles/:articleId
 * @desc    删除文章
 * @access  Private
 */
router.delete('/:articleId', authenticateToken, async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;

    const success = await deleteArticle(parseInt(articleId), userId);

    if (!success) {
      return res.status(404).json({
        code: 404,
        data: null,
        error: '文章不存在或无权删除',
        msg: '文章不存在或无权删除'
      });
    }

    res.json({
      code: 0,
      data: null,
      msg: '删除成功'
    });

  } catch (error) {
    console.error('删除文章错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '删除文章失败',
      msg: error.message || '删除文章失败'
    });
  }
});

/**
 * @route   POST /api/articles/:articleId/like
 * @desc    点赞/取消点赞文章
 * @access  Private
 */
router.post('/:articleId/like', authenticateToken, async (req, res) => {
  try {
    const { articleId } = req.params;
    const userId = req.user.id;

    const result = await toggleArticleLike(parseInt(articleId), userId);

    res.json({
      code: 0,
      data: result,
      msg: result.liked ? '点赞成功' : '取消点赞成功'
    });

  } catch (error) {
    console.error('点赞文章错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '操作失败',
      msg: error.message || '操作失败'
    });
  }
});

/**
 * @route   POST /api/articles/:articleId/comments
 * @desc    添加文章评论
 * @access  Private
 */
router.post('/:articleId/comments', authenticateToken, [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('评论内容不能为空')
    .isLength({ max: 1000 })
    .withMessage('评论内容不能超过1000个字符')
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

    const { articleId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await addArticleComment(parseInt(articleId), userId, content);

    res.status(201).json({
      code: 0,
      data: { comment },
      msg: '评论成功'
    });

  } catch (error) {
    console.error('添加文章评论错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '添加评论失败',
      msg: error.message || '添加评论失败'
    });
  }
});

/**
 * @route   GET /api/articles/:articleId/comments
 * @desc    获取文章评论列表
 * @access  Public
 */
router.get('/:articleId/comments', optionalAuth, async (req, res) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await getArticleComments(
      parseInt(articleId),
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      code: 0,
      data: result,
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取文章评论列表错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '获取评论列表失败',
      msg: error.message || '获取评论列表失败'
    });
  }
});

/**
 * @route   DELETE /api/articles/:articleId/comments/:commentId
 * @desc    删除文章评论
 * @access  Private
 */
router.delete('/:articleId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const success = await deleteArticleComment(parseInt(commentId), userId);

    if (success) {
      res.json({
        code: 0,
        data: null,
        msg: '删除评论成功'
      });
    } else {
      res.status(404).json({
        code: 404,
        data: null,
        error: '评论不存在或无权删除',
        msg: '评论不存在或无权删除'
      });
    }

  } catch (error) {
    console.error('删除文章评论错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '删除评论失败',
      msg: error.message || '删除评论失败'
    });
  }
});

export default router;

