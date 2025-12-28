import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import {
  addUserExperience,
  updateUserExperience,
  deleteUserExperience,
  getUserExperiences,
  getUserExperienceById
} from '../services/userExperienceService.js';

const router = express.Router();

// 工作经历相关 API

/**
 * @route   GET /api/experiences
 * @desc    获取当前用户的工作经历
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const experiences = await getUserExperiences(userId);
    
    res.json({
      code: 0,
      data: {
        experiences
      },
      msg: '获取成功'
    });
  } catch (error) {
    console.error('获取工作经历错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '获取工作经历失败'
    });
  }
});

/**
 * @route   POST /api/experiences
 * @desc    添加工作经历
 * @access  Private
 */
router.post('/', authenticateToken, [
  body('company')
    .trim()
    .notEmpty()
    .withMessage('公司名称不能为空')
    .isLength({ max: 100 })
    .withMessage('公司名称不能超过100个字符'),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('职位不能为空')
    .isLength({ max: 100 })
    .withMessage('职位不能超过100个字符'),
  body('startDate')
    .notEmpty()
    .withMessage('开始日期不能为空')
    .isDate()
    .withMessage('开始日期格式不正确'),
  body('endDate')
    .optional({ nullable: true })
    .isDate()
    .withMessage('结束日期格式不正确'),
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
    const experienceData = req.body;

    const experience = await addUserExperience(userId, experienceData);

    res.json({
      code: 0,
      data: {
        experience
      },
      msg: '工作经历添加成功'
    });
  } catch (error) {
    console.error('添加工作经历错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '添加工作经历失败'
    });
  }
});

/**
 * @route   PUT /api/experiences/:id
 * @desc    更新工作经历
 * @access  Private
 */
router.put('/:id', authenticateToken, [
  body('company')
    .trim()
    .notEmpty()
    .withMessage('公司名称不能为空')
    .isLength({ max: 100 })
    .withMessage('公司名称不能超过100个字符'),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('职位不能为空')
    .isLength({ max: 100 })
    .withMessage('职位不能超过100个字符'),
  body('startDate')
    .notEmpty()
    .withMessage('开始日期不能为空')
    .isDate()
    .withMessage('开始日期格式不正确'),
  body('endDate')
    .optional({ nullable: true })
    .isDate()
    .withMessage('结束日期格式不正确'),
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
    const experienceData = req.body;

    const experience = await updateUserExperience(parseInt(id), userId, experienceData);

    if (!experience) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '工作经历不存在或无权限更新'
      });
    }

    res.json({
      code: 0,
      data: {
        experience
      },
      msg: '工作经历更新成功'
    });
  } catch (error) {
    console.error('更新工作经历错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '更新工作经历失败'
    });
  }
});

/**
 * @route   DELETE /api/experiences/:id
 * @desc    删除工作经历
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const success = await deleteUserExperience(parseInt(id), userId);

    if (!success) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '工作经历不存在或无权限删除'
      });
    }

    res.json({
      code: 0,
      data: {},
      msg: '工作经历删除成功'
    });
  } catch (error) {
    console.error('删除工作经历错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      msg: '删除工作经历失败'
    });
  }
});

// 教育经历相关 API

export default router;