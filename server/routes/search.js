import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { getMySQLPool } from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/search/users
 * @desc    搜索用户
 * @access  Public
 */
router.get('/users', optionalAuth, async (req, res) => {
  try {
    const { q: query = '', page = 1, limit = 20 } = req.query;
    const pool = getMySQLPool();
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const offsetNum = (pageNum - 1) * limitNum;

    // 处理查询字符串（可能是字符串或数字）
    const queryStr = String(query || '').trim();
    const queryLower = queryStr.toLowerCase();

    // 如果查询为空或为 'default'，返回推荐用户（按创建时间倒序）
    if (!queryStr || queryLower === 'default') {
      // 确保参数是整数类型
      const limitInt = Number(limitNum);
      const offsetInt = Number(offsetNum);
      
      console.log('推荐用户查询参数:', {
        limitNum,
        offsetNum,
        limitInt,
        offsetInt,
        limitType: typeof limitInt,
        offsetType: typeof offsetInt
      });

      // 使用字符串插值处理 LIMIT 和 OFFSET，避免参数类型问题
      const query = `
        SELECT 
          u.id, 
          u.username, 
          u.avatar, 
          up.bio, 
          up.location, 
          up.website,
          up.position,
          up.company,
          u.created_at
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        ORDER BY u.created_at DESC
        LIMIT ${limitInt} OFFSET ${offsetInt}
      `;

      const [users] = await pool.execute(query);

      // 获取总数
      const [totalResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM users'
      );
      const total = totalResult[0]?.total || 0;

      // 获取每个用户的技能，并移除内部的created_at字段（不对外暴露）
      for (const user of users) {
        const [skills] = await pool.execute(
          'SELECT skill_name FROM user_skills WHERE user_id = ?',
          [user.id]
        );
        user.skills = skills.map(skill => skill.skill_name);
        // 删除内部的created_at字段，因为它仅用于排序
        delete user.created_at;
      }

      return res.json({
        code: 0,
        data: {
          users,
          total,
          page: pageNum,
          limit: limitNum
        },
        msg: '获取推荐用户成功'
      });
    }

    // 有查询关键词时，进行搜索
    const searchPattern = `%${queryStr}%`;
    const searchParams = [];

    // 构建搜索条件（使用 COALESCE 处理 NULL 值，避免参数不匹配）
    const searchQuery = `(
      u.username LIKE ? OR
      COALESCE(up.bio, '') LIKE ? OR
      COALESCE(up.location, '') LIKE ? OR
      COALESCE(up.website, '') LIKE ? OR
      COALESCE(up.position, '') LIKE ? OR
      COALESCE(up.company, '') LIKE ? OR
      EXISTS (
        SELECT 1 FROM user_skills us 
        WHERE us.user_id = u.id AND us.skill_name LIKE ?
      )
    )`;

    // 所有搜索条件使用相同的模式
    searchParams.push(
      searchPattern, // u.username
      searchPattern, // up.bio
      searchPattern, // up.location
      searchPattern, // up.website
      searchPattern, // up.position
      searchPattern, // up.company
      searchPattern  // user_skills.skill_name
    );

    // 查询总数
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE ${searchQuery}
    `;

    const [totalResult] = await pool.execute(countQuery, searchParams);
    const total = totalResult[0]?.total || 0;

    // 确保分页参数是整数类型
    const limitInt = Number(limitNum);
    const offsetInt = Number(offsetNum);

    // 使用字符串插值处理 LIMIT 和 OFFSET，避免参数类型问题
    const paginatedQuery = `
      SELECT DISTINCT 
        u.id, 
        u.username, 
        u.avatar, 
        up.bio, 
        up.location, 
        up.website,
        up.position,
        up.company,
        u.created_at
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE ${searchQuery}
      ORDER BY u.created_at DESC
      LIMIT ${limitInt} OFFSET ${offsetInt}
    `;

    const [users] = await pool.execute(paginatedQuery, searchParams);

    // 获取每个用户的技能，并移除内部的created_at字段（不对外暴露）
    for (const user of users) {
      const [skills] = await pool.execute(
        'SELECT skill_name FROM user_skills WHERE user_id = ?',
        [user.id]
      );
      user.skills = skills.map(skill => skill.skill_name);
      // 删除内部的created_at字段，因为它仅用于排序
      delete user.created_at;
    }

    res.json({
      code: 0,
      data: {
        users,
        total,
        page: pageNum,
        limit: limitNum
      },
      msg: '搜索成功'
    });

  } catch (error) {
    console.error('搜索用户错误:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      query: req.query
    });
    res.status(500).json({
      code: 500,
      data: null,
      error: '搜索失败',
      msg: error.message || '搜索失败'
    });
  }
});

/**
 * @route   GET /api/search/files
 * @desc    搜索文件
 * @access  Public
 */
router.get('/files', optionalAuth, async (req, res) => {
  try {
    const { q: query, category, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        error: '请提供搜索关键词'
      });
    }

    const pool = getMySQLPool();

    // 构建搜索查询
    const searchFields = ['uf.title', 'uf.description', 'uf.original_name', 'ft.tag'];
    const searchConditions = [];
    const params = [];

    for (const field of searchFields) {
      searchConditions.push(`${field} LIKE ?`);
      params.push(`%${query}%`);
    }

    const searchQuery = `(${searchConditions.join(' OR ')})`;

    // 构建主查询
    let baseQuery = `
      SELECT uf.*, u.username as owner_username,
             (SELECT COUNT(*) FROM file_likes fl WHERE fl.file_id = uf.id) as likeCount,
             (SELECT COUNT(*) FROM file_comments fc WHERE fc.file_id = uf.id) as commentCount
      FROM user_files uf
      JOIN users u ON uf.user_id = u.id
      LEFT JOIN file_tags ft ON uf.id = ft.file_id
      WHERE uf.visibility = 'public' AND ${searchQuery}
    `;

    if (category) {
      baseQuery += ` AND uf.category = ?`;
      params.push(category);
    }

    baseQuery += ' GROUP BY uf.id ORDER BY uf.uploaded_at DESC';

    // 查询总数
    let countQuery = `
      SELECT COUNT(DISTINCT uf.id) as total
      FROM user_files uf
      JOIN users u ON uf.user_id = u.id
      LEFT JOIN file_tags ft ON uf.id = ft.file_id
      WHERE uf.visibility = 'public' AND ${searchQuery}
    `;

    if (category) {
      countQuery += ` AND uf.category = ?`;
    }

    const [totalResult] = await pool.execute(countQuery, params);
    const total = totalResult[0].total;

    // 添加分页
    const paginatedQuery = `${baseQuery} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [files] = await pool.execute(paginatedQuery, params);

    // 为每个文件获取标签
    for (const file of files) {
      const [tags] = await pool.execute(
        'SELECT tag FROM file_tags WHERE file_id = ?',
        [file.id]
      );
      file.tags = tags.map(tag => tag.tag);
    }

    res.json({
      files,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('搜索文件错误:', error);
    res.status(500).json({
      error: '搜索失败'
    });
  }
});

/**
 * @route   GET /api/search/suggestions
 * @desc    获取搜索建议
 * @access  Public
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    const pool = getMySQLPool();

    // 获取用户建议
    const [users] = await pool.execute(
      `SELECT username FROM users
       WHERE username LIKE ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [`${query}%`]
    );

    const suggestions = {
      users: users.map(u => ({
        type: 'user',
        value: u.username,
        label: u.username
      }))
    };

    res.json(suggestions);

  } catch (error) {
    console.error('获取搜索建议错误:', error);
    res.status(500).json({
      error: '获取搜索建议失败'
    });
  }
});

export default router;
