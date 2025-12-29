import express from 'express';
import { body, validationResult } from 'express-validator';
import { getUserByUsername, updateUserProfile, getUserStats } from '../services/userService.js';
import { getUserFiles } from '../services/fileService.js';
import { getMySQLPool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple, processFileUpload, createUploadInstance } from '../utils/upload.js';

const router = express.Router();

// 创建支持多个字段的上传中间件
const uploadFields = () => {
  return (req, res, next) => {
    const upload = createUploadInstance();
    upload.fields([
      { name: 'avatar', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        console.error('文件上传中间件错误:', err);
        return res.status(400).json({
          code: 400,
          data: null,
          error: err.message,
          msg: '文件上传失败'
        });
      }
      next();
    });
  };
};

/**
 * @route   GET /api/users/:username
 * @desc    获取用户公开信息
 * @access  Public
 */
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 获取用户统计信息
    const stats = await getUserStats(user.id);

    res.json({
      code: 0,
      data: {
        user: {
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          website: user.website,
          coverImage: user.cover_image || null,
          skills: user.skills,
          socialLinks: user.socialLinks,
          isActive: true // 假设用户是活跃的，如果需要可以从users表的其他字段获取
        },
        stats: stats
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      error: '获取用户信息失败'
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    更新用户档案（支持同时上传头像和背景图片）
 * @access  Private
 */
router.put('/profile', authenticateToken, uploadFields(), [
  body('bio')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      return value.length <= 200;
    })
    .withMessage('个人简介不能超过200个字符'),
  body('location')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      return value.length <= 100;
    })
    .withMessage('所在地不能超过100个字符'),
  body('website')
    .optional({ values: 'falsy' })
    .custom((value) => {
      // 允许空字符串
      if (value === '' || value === null || value === undefined) return true;
      // 如果有值，验证是否为有效URL
      try {
        const url = new URL(value.startsWith('http') ? value : `http://${value}`);
        return url.hostname.length > 0;
      } catch {
        return false;
      }
    })
    .withMessage('请提供有效的网站URL'),
  body('skills')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      // 支持字符串（JSON格式）或数组
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          // 如果不是JSON，尝试逗号分隔
          return true; // 允许逗号分隔的字符串，后续会处理
        }
      }
      return Array.isArray(value);
    })
    .withMessage('技能必须是数组或JSON字符串'),
  body('socialLinks')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (value === '' || value === null || value === undefined) return true;
      return typeof value === 'object' && !Array.isArray(value);
    })
    .withMessage('社交链接必须是对象')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('验证错误:', errors.array());
      return res.status(400).json({
        code: 400,
        data: null,
        error: '输入数据验证失败',
        details: errors.array(),
        msg: '请检查输入数据'
      });
    }

    const userId = req.user.id;
    const pool = getMySQLPool();
    
    console.log('收到更新档案请求:', {
      userId,
      body: req.body,
      files: req.files ? Object.keys(req.files) : 'no files',
      hasAvatar: !!(req.files && req.files.avatar),
      hasCoverImage: !!(req.files && req.files.coverImage)
    });
    
    // 处理文件上传（头像和背景图片）
    let avatarUrl = null;
    let coverImageUrl = null;

    // 处理头像上传（使用fields时，req.files是对象）
    if (req.files && req.files.avatar && req.files.avatar.length > 0) {
      const avatarFile = req.files.avatar[0];
      try {
        avatarUrl = await processFileUpload(avatarFile, userId, 'avatar');
        console.log('头像上传成功，URL:', avatarUrl);
        
        // 更新数据库中的头像
        await pool.execute(
          'UPDATE users SET avatar = ? WHERE id = ?',
          [avatarUrl, userId]
        );
      } catch (uploadError) {
        console.error('头像上传失败（详细错误）:', {
          message: uploadError.message,
          stack: uploadError.stack,
          code: uploadError.code,
          name: uploadError.name,
          fullError: uploadError
        });
        return res.status(500).json({
          code: 500,
          data: null,
          msg: '头像上传失败: ' + uploadError.message,
          error: process.env.NODE_ENV === 'development' ? {
            message: uploadError.message,
            code: uploadError.code,
            stack: uploadError.stack
          } : undefined
        });
      }
    }

    // 处理背景图片上传
    if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
      const coverFile = req.files.coverImage[0];
      try {
        coverImageUrl = await processFileUpload(coverFile, userId, 'cover');
        console.log('背景图片上传成功，URL:', coverImageUrl);
        
        // 更新数据库中的背景图片
        await pool.execute(
          `INSERT INTO user_profiles (user_id, cover_image, updated_at) 
           VALUES (?, ?, CURRENT_TIMESTAMP)
           ON DUPLICATE KEY UPDATE cover_image = ?, updated_at = CURRENT_TIMESTAMP`,
          [userId, coverImageUrl, coverImageUrl]
        );
      } catch (uploadError) {
        console.error('背景图片上传失败（详细错误）:', {
          message: uploadError.message,
          stack: uploadError.stack,
          code: uploadError.code,
          name: uploadError.name,
          fullError: uploadError
        });
        return res.status(500).json({
          code: 500,
          data: null,
          msg: '背景图片上传失败: ' + uploadError.message,
          error: process.env.NODE_ENV === 'development' ? {
            message: uploadError.message,
            code: uploadError.code,
            stack: uploadError.stack
          } : undefined
        });
      }
    }

    // 处理其他字段更新
    const updates = {};
    
    // 处理空字符串，转换为null或空字符串（根据数据库需求）
    if (req.body.bio !== undefined) {
      updates.bio = req.body.bio === '' ? null : req.body.bio;
    }
    if (req.body.location !== undefined) {
      updates.location = req.body.location === '' ? null : req.body.location;
    }
    if (req.body.website !== undefined) {
      updates.website = req.body.website === '' ? null : req.body.website;
    }
    if (req.body.skills !== undefined) {
      // 处理skills（可能是JSON字符串或数组）
      let skillsArray;
      if (typeof req.body.skills === 'string') {
        try {
          skillsArray = JSON.parse(req.body.skills);
          console.log('Skills解析成功（JSON）:', skillsArray);
        } catch {
          skillsArray = req.body.skills.split(',').map(s => s.trim()).filter(s => s);
          console.log('Skills解析为逗号分隔:', skillsArray);
        }
      } else {
        skillsArray = req.body.skills;
        console.log('Skills已经是数组:', skillsArray);
      }
      updates.skills = skillsArray;
    }
    if (req.body.socialLinks !== undefined) updates.socialLinks = req.body.socialLinks;

    // 更新用户信息
    const user = await updateUserProfile(userId, updates);

    if (!user) {
      return res.status(404).json({
        code: 404,
        data: null,
        msg: '用户不存在'
      });
    }

    // 构建返回数据，包含上传的文件URL
    const responseData = { user };
    if (avatarUrl) responseData.avatar = avatarUrl;
    if (coverImageUrl) responseData.coverImage = coverImageUrl;

    console.log('档案更新成功，返回数据:', {
      userId,
      hasAvatar: !!avatarUrl,
      hasCoverImage: !!coverImageUrl,
      skillsUpdated: !!updates.skills
    });

    res.json({
      code: 0,
      data: responseData,
      msg: '档案更新成功'
    });

  } catch (error) {
    console.error('更新用户档案错误（完整信息）:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      code: 500,
      data: null,
      msg: '更新失败: ' + (error.message || '未知错误'),
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   POST /api/users/avatar
 * @desc    上传并更新用户头像
 * @access  Private
 */
router.post('/avatar', authenticateToken, uploadSingle('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '请上传头像文件'
      });
    }

    console.log('收到头像上传请求:', {
      userId,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      hasBuffer: !!req.file.buffer,
      hasPath: !!req.file.path,
      filename: req.file.filename
    });

    // 上传文件到TOS
    let avatarUrl;
    try {
      avatarUrl = await processFileUpload(req.file, userId, 'avatar');
      console.log('文件上传成功，URL:', avatarUrl);
    } catch (uploadError) {
      console.error('文件上传失败:', uploadError);
      return res.status(500).json({
        code: 500,
        data: null,
        msg: '文件上传失败: ' + uploadError.message
      });
    }

    const pool = getMySQLPool();

    // 更新头像
    try {
      await pool.execute(
        'UPDATE users SET avatar = ? WHERE id = ?',
        [avatarUrl, userId]
      );
      console.log('数据库更新成功，用户ID:', userId);
    } catch (dbError) {
      console.error('数据库更新失败:', dbError);
      return res.status(500).json({
        code: 500,
        data: null,
        msg: '保存头像URL到数据库失败: ' + dbError.message
      });
    }

    res.json({
      code: 0,
      data: {
        avatar: avatarUrl
      },
      msg: '头像更新成功'
    });

  } catch (error) {
    console.error('更新头像错误（完整错误信息）:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      code: 500,
      data: null,
      msg: '更新失败: ' + (error.message || '未知错误')
    });
  }
});

/**
 * @route   POST /api/users/cover
 * @desc    上传并更新用户背景图片
 * @access  Private
 */
router.post('/cover', authenticateToken, uploadSingle('cover'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '请上传背景图片文件'
      });
    }

    console.log('收到背景图片上传请求:', {
      userId,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      hasBuffer: !!req.file.buffer,
      bufferLength: req.file.buffer?.length || 0
    });

    // 检查文件是否为空
    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.error('上传的文件为空');
      return res.status(400).json({
        code: 400,
        data: null,
        msg: '上传的文件为空，请选择有效的图片文件'
      });
    }

    // 上传文件到TOS
    let coverUrl;
    try {
      coverUrl = await processFileUpload(req.file, userId, 'cover');
      console.log('背景图片上传成功，URL:', coverUrl);
    } catch (uploadError) {
      console.error('背景图片上传失败:', uploadError);
      return res.status(500).json({
        code: 500,
        data: null,
        msg: '文件上传失败: ' + uploadError.message
      });
    }

    const pool = getMySQLPool();

    // 更新背景图片（存储在user_profiles表中）
    try {
      await pool.execute(
        `INSERT INTO user_profiles (user_id, cover_image, updated_at) 
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE cover_image = ?, updated_at = CURRENT_TIMESTAMP`,
        [userId, coverUrl, coverUrl]
      );
      console.log('数据库更新成功，用户ID:', userId);
    } catch (dbError) {
      console.error('数据库更新失败:', dbError);
      return res.status(500).json({
        code: 500,
        data: null,
        msg: '保存背景图片URL到数据库失败: ' + dbError.message
      });
    }

    res.json({
      code: 0,
      data: {
        coverImage: coverUrl
      },
      msg: '背景图片更新成功'
    });

  } catch (error) {
    console.error('更新背景图片错误:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      code: 500,
      data: null,
      msg: '更新失败: ' + (error.message || '未知错误')
    });
  }
});

/**
 * @route   GET /api/users/:username/files
 * @desc    获取用户的文件列表
 * @access  Public
 */
router.get('/:username/files', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10, category, visibility = 'public' } = req.query;

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 获取用户的文件列表
    const result = await getUserFiles(user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      visibility
    });

    res.json(result);

  } catch (error) {
    console.error('获取用户文件错误:', error);
    res.status(500).json({
      error: '获取文件列表失败'
    });
  }
});

// 添加用户活动流API端点
import { optionalAuth } from '../middleware/auth.js';

/**
 * @route   GET /api/users/:username/activity
 * @desc    获取用户活动流（包括文件上传、文章发布、图片分享等）
 * @access  Public
 */
router.get('/:username/activity', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // 确保分页参数是有效的整数
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // 限制最大每页数量为100
    const offset = (pageNum - 1) * limitNum;

    console.log('活动接口参数调试:', { username, page, limit, pageNum, limitNum, offset });

    const pool = getMySQLPool();

    // 获取用户ID
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 1,
        data: null,
        msg: '用户不存在'
      });
    }

    const userId = users[0].id;

    // 确保所有参数都是整数类型
    const userIdInt = parseInt(userId);
    const limitNumInt = parseInt(limitNum);
    const offsetInt = parseInt(offset);

    console.log('查询用户活动，参数:', { userId: userIdInt, limitNum: limitNumInt, offset: offsetInt });

    // 查询用户活动（这里主要获取文件上传活动）
    // 使用字符串拼接方式处理 LIMIT 和 OFFSET，避免参数类型问题
    const query = `
      SELECT
         uf.id,
         'file_upload' as type,
         uf.title,
         uf.description,
         uf.original_name as originalName,
         uf.size,
         uf.mime_type as mimeType,
         uf.uploaded_at as uploadedAt,
         (SELECT COUNT(*) FROM file_likes fl WHERE fl.file_id = uf.id) as likeCount,
         (SELECT COUNT(*) FROM file_comments fc WHERE fc.file_id = uf.id) as commentCount,
         u.id as userId,
         u.username,
         u.avatar
       FROM user_files uf
       JOIN users u ON uf.user_id = u.id
       WHERE uf.user_id = ? AND uf.visibility = 'public'
       ORDER BY uf.uploaded_at DESC
       LIMIT ${limitNumInt} OFFSET ${offsetInt}`;

    console.log('执行的SQL查询:', query);

    const [activities] = await pool.execute(query, [userIdInt]);

    // 获取活动总数
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM user_files WHERE user_id = ? AND visibility = ?',
      [userIdInt, 'public']
    );

    res.json({
      code: 0,
      data: {
        activities,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalResult[0].total
        }
      },
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取用户活动流错误:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      code: 1,
      data: null,
      msg: '获取活动流失败: ' + error.message
    });
  }
});

export default router;
