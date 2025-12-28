import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import {
  addUserEducation,
  updateUserEducation,
  deleteUserEducation,
  getUserEducations,
  getUserEducationById
} from '../services/userEducationService.js';

const router = express.Router();

// 教育经历相关 API

/**
 * @route   GET /api/educations
 * @desc    获取当前用户的教育经历
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const educations = await getUserEducations(userId);

    res.json({
      code: 0,
      data: {
        educations
      },
      msg: '获取成功'
    });
  } catch (error) {
    console.error('获取教育经历错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '获取教育经历失败'
    });
  }
});

/**
 * @route   POST /api/educations
 * @desc    添加教育经历
 * @access  Private
 */
router.post('/', authenticateToken, [
  body('school')
    .trim()
    .notEmpty()
    .withMessage('学校名称不能为空')
    .isLength({ max: 100 })
    .withMessage('学校名称不能超过100个字符'),
  body('startDate')
    .notEmpty()
    .withMessage('开始日期不能为空')
    .isDate()
    .withMessage('开始日期格式不正确'),
  body('endDate')
    .optional({ nullable: true })
    .isDate()
    .withMessage('结束日期格式不正确'),
  body('degree')
    .optional()
    .isLength({ max: 50 })
    .withMessage('学位不能超过50个字符'),
  body('major')
    .optional()
    .isLength({ max: 100 })
    .withMessage('专业不能超过100个字符'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符')
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

    const userId = req.user.id;
    const educationData = req.body;

    const education = await addUserEducation(userId, educationData);

    res.json({
      code: 0,
      data: {
        education
      },
      msg: '教育经历添加成功'
    });
  } catch (error) {
    console.error('添加教育经历错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '添加教育经历失败'
    });
  }
});

/**
 * @route   PUT /api/educations/:id
 * @desc    更新教育经历
 * @access  Private
 */
router.put('/:id', authenticateToken, [
  body('school')
    .trim()
    .notEmpty()
    .withMessage('学校名称不能为空')
    .isLength({ max: 100 })
    .withMessage('学校名称不能超过100个字符'),
  body('startDate')
    .notEmpty()
    .withMessage('开始日期不能为空')
    .isDate()
    .withMessage('开始日期格式不正确'),
  body('endDate')
    .optional({ nullable: true })
    .isDate()
    .withMessage('结束日期格式不正确'),
  body('degree')
    .optional()
    .isLength({ max: 50 })
    .withMessage('学位不能超过50个字符'),
  body('major')
    .optional()
    .isLength({ max: 100 })
    .withMessage('专业不能超过100个字符'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符')
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

    const { id } = req.params;
    const userId = req.user.id;
    const educationData = req.body;

    const education = await updateUserEducation(parseInt(id), userId, educationData);

    if (!education) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '教育经历不存在或无权限更新'
      });
    }

    res.json({
      code: 0,
      data: {
        education
      },
      msg: '教育经历更新成功'
    });
  } catch (error) {
    console.error('更新教育经历错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '更新教育经历失败'
    });
  }
});

/**
 * @route   DELETE /api/educations/:id
 * @desc    删除教育经历
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const success = await deleteUserEducation(parseInt(id), userId);

    if (!success) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '教育经历不存在或无权限删除'
      });
    }

    res.json({
      code: 0,
      data: {},
      msg: '教育经历删除成功'
    });
  } catch (error) {
    console.error('删除教育经历错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '删除教育经历失败'
    });
  }
});

export default router;