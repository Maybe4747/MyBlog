import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { getMySQLPool } from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/search
 * @desc    统一搜索接口 - 搜索用户、帖子、文章、文件
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        code: 400,
        data: null,
        error: '请提供搜索关键词',
        msg: '请提供搜索关键词'
      });
    }

    const currentUserId = req.user?.id || null;
    const searchQuery = String(query).trim();
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    // 并行执行所有搜索
    const [usersResult, postsResult, articlesResult, filesResult] = await Promise.all([
      // 搜索用户
      (async () => {
        try {
          const pool = getMySQLPool();
          const searchPattern = `%${searchQuery}%`;
          const exactMatchPattern = searchQuery.trim();
          const limitInt = Number(limitNum);
          const offsetInt = Number((pageNum - 1) * limitNum);
          
          // 构建搜索条件（优先匹配用户名）
          const searchQuerySQL = `(
            u.username LIKE ? OR
            u.username = ? OR
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
          
          // 参数：模糊匹配用户名、精确匹配用户名、其他字段
          const searchParams = [
            searchPattern, // u.username LIKE
            exactMatchPattern, // u.username =
            searchPattern, // up.bio
            searchPattern, // up.location
            searchPattern, // up.website
            searchPattern, // up.position
            searchPattern, // up.company
            searchPattern  // user_skills.skill_name
          ];
          
          console.log('用户搜索参数:', { 
            searchQuery, 
            searchPattern, 
            exactMatchPattern,
            paramsCount: searchParams.length, 
            limitInt, 
            offsetInt 
          });

          // 查询用户列表（优先显示精确匹配和用户名匹配的结果）
          // 先尝试简单查询，确保基本功能正常
          console.log('SQL参数详情:', {
            searchParamsCount: searchParams.length,
            searchParams: searchParams,
            searchQuerySQL: searchQuerySQL
          });

          // 使用GROUP BY确保每个用户只返回一条记录，避免重复
          // 注意：使用GROUP BY时，ORDER BY中的列必须在SELECT列表中
          // 所以需要包含u.created_at，但之后会删除它
          const querySQL = `SELECT 
               u.id, 
               u.username, 
               u.avatar, 
               COALESCE(up.bio, '') as bio, 
               COALESCE(up.location, '') as location, 
               COALESCE(up.website, '') as website,
               COALESCE(up.position, '') as position,
               COALESCE(up.company, '') as company,
               u.created_at
             FROM users u
             LEFT JOIN user_profiles up ON u.id = up.user_id
             WHERE ${searchQuerySQL}
             GROUP BY u.id, u.username, u.avatar, up.bio, up.location, up.website, up.position, up.company, u.created_at
             ORDER BY 
               CASE 
                 WHEN u.username = ? THEN 1
                    WHEN u.username LIKE ? THEN 2 
                 ELSE 3
               END,
               u.created_at DESC
             LIMIT ${limitInt} OFFSET ${offsetInt}`;
          
          // ORDER BY需要额外的两个参数（精确匹配和模糊匹配）
          const orderByParams = [exactMatchPattern, searchPattern];
          const allParams = [...searchParams, ...orderByParams];
          
          console.log('执行SQL查询:', querySQL.replace(/\?/g, (match, offset) => {
            const paramIndex = querySQL.substring(0, offset).split('?').length - 1;
            return `'${allParams[paramIndex] || '?'}'`;
          }));
          console.log('SQL参数总数:', allParams.length);
          console.log('SQL参数值:', allParams);

          let users;
          try {
            [users] = await pool.execute(querySQL, allParams);
            // 删除created_at字段，因为不需要返回给前端
            users = users.map(user => {
              const { created_at, ...rest } = user;
              return rest;
            });
          console.log('用户搜索结果数量:', users.length);
            if (users.length > 0) {
              console.log('用户搜索结果:', JSON.stringify(users, null, 2));
            } else {
              console.log('未找到匹配的用户，尝试简化查询...');
              // 如果没找到，尝试只搜索用户名
              const simpleQuery = `SELECT 
                u.id, 
                u.username, 
                u.avatar, 
                COALESCE(up.bio, '') as bio, 
                COALESCE(up.location, '') as location, 
                COALESCE(up.website, '') as website,
                COALESCE(up.position, '') as position,
                COALESCE(up.company, '') as company,
                u.created_at
              FROM users u
              LEFT JOIN user_profiles up ON u.id = up.user_id
              WHERE u.username LIKE ? OR u.username = ?
              GROUP BY u.id, u.username, u.avatar, up.bio, up.location, up.website, up.position, up.company, u.created_at
              ORDER BY u.created_at DESC
              LIMIT ${limitInt} OFFSET ${offsetInt}`;
              let [simpleUsers] = await pool.execute(simpleQuery, [searchPattern, exactMatchPattern]);
              // 删除created_at字段
              simpleUsers = simpleUsers.map(user => {
                const { created_at, ...rest } = user;
                return rest;
              });
              console.log('简化查询结果数量:', simpleUsers.length);
              if (simpleUsers.length > 0) {
                console.log('简化查询找到用户:', JSON.stringify(simpleUsers, null, 2));
                users = simpleUsers;
              }
            }
          } catch (sqlError) {
            console.error('SQL执行错误:', sqlError);
            console.error('错误详情:', {
              message: sqlError.message,
              code: sqlError.code,
              sqlState: sqlError.sqlState,
              sqlMessage: sqlError.sqlMessage
            });
            // 如果复杂查询失败，尝试简单查询
            try {
              console.log('尝试使用简化查询...');
              const simpleQuery = `SELECT 
                u.id, 
                u.username, 
                u.avatar, 
                COALESCE(up.bio, '') as bio, 
                COALESCE(up.location, '') as location, 
                COALESCE(up.website, '') as website,
                COALESCE(up.position, '') as position,
                COALESCE(up.company, '') as company,
                u.created_at
              FROM users u
              LEFT JOIN user_profiles up ON u.id = up.user_id
              WHERE u.username LIKE ? OR u.username = ?
              GROUP BY u.id, u.username, u.avatar, up.bio, up.location, up.website, up.position, up.company, u.created_at
              ORDER BY u.created_at DESC
              LIMIT ${limitInt} OFFSET ${offsetInt}`;
              let [simpleUsers] = await pool.execute(simpleQuery, [searchPattern, exactMatchPattern]);
              // 删除created_at字段
              simpleUsers = simpleUsers.map(user => {
                const { created_at, ...rest } = user;
                return rest;
              });
              console.log('简化查询成功，找到用户数量:', simpleUsers.length);
              users = simpleUsers;
            } catch (simpleError) {
              console.error('简化查询也失败:', simpleError);
              throw sqlError; // 抛出原始错误
            }
          }

          // 计算总数（不需要ORDER BY参数）
          const [totalResult] = await pool.execute(
            `SELECT COUNT(DISTINCT u.id) as total
             FROM users u
             LEFT JOIN user_profiles up ON u.id = up.user_id
             WHERE ${searchQuerySQL}`,
            searchParams
          );
          
          console.log('用户搜索总数:', totalResult[0]?.total || 0);

          // 获取每个用户的技能和关注状态
          for (const user of users) {
            const [skills] = await pool.execute(
              'SELECT skill_name FROM user_skills WHERE user_id = ?',
              [user.id]
            );
            user.skills = skills.map(skill => skill.skill_name);

            if (currentUserId) {
              const [follows] = await pool.execute(
                'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
                [currentUserId, user.id]
              );
              user.isFollowing = follows.length > 0;
            } else {
              user.isFollowing = false;
            }
          }

          const result = {
            users: users,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: totalResult[0]?.total || 0
            }
          };
          
          console.log('用户搜索返回结果:', JSON.stringify(result, null, 2));
          return result;
        } catch (err) {
          console.error('搜索用户错误:', err);
          return { users: [], pagination: { page: pageNum, limit: limitNum, total: 0 } };
        }
      })(),
      
      // 搜索帖子
      (async () => {
        try {
          const { getPosts } = await import('../services/postService.js');
          const result = await getPosts({
            page: pageNum,
            limit: limitNum,
            visibility: 'public',
            currentUserId,
            search: searchQuery
          });
          return result;
        } catch (err) {
          console.error('搜索帖子错误:', err);
          return { posts: [], pagination: { page: pageNum, limit: limitNum, total: 0 } };
        }
      })(),
      
      // 搜索文章
      (async () => {
        try {
          const { getArticles } = await import('../services/articleService.js');
          const result = await getArticles({
            page: pageNum,
            limit: limitNum,
            visibility: 'public',
            currentUserId,
            search: searchQuery
          });
          return result;
        } catch (err) {
          console.error('搜索文章错误:', err);
          return { articles: [], pagination: { page: pageNum, limit: limitNum, total: 0 } };
        }
      })(),
      
      // 搜索文件
      (async () => {
        try {
          const pool = getMySQLPool();
          const searchFields = ['uf.title', 'uf.description', 'uf.original_name', 'ft.tag'];
          const searchConditions = [];
          const params = [];

          for (const field of searchFields) {
            searchConditions.push(`${field} LIKE ?`);
            params.push(`%${searchQuery}%`);
          }

          const searchQuerySQL = `(${searchConditions.join(' OR ')})`;
          
          const queryParams = [];
          if (currentUserId) {
            queryParams.push(currentUserId);
          }
          queryParams.push(...params);

          const limitInt = Number(limitNum);
          const offsetInt = Number((pageNum - 1) * limitNum);

          let baseQuery = `
            SELECT uf.*, u.username as owner_username, u.avatar as owner_avatar,
                   (SELECT COUNT(*) FROM file_likes fl WHERE fl.file_id = uf.id) as likeCount,
                   (SELECT COUNT(*) FROM file_comments fc WHERE fc.file_id = uf.id) as commentCount
            FROM user_files uf
            JOIN users u ON uf.user_id = u.id
            LEFT JOIN file_tags ft ON uf.id = ft.file_id
            WHERE (uf.visibility = 'public'${currentUserId ? ' OR uf.user_id = ?' : ''}) AND ${searchQuerySQL}
            GROUP BY uf.id ORDER BY uf.uploaded_at DESC
            LIMIT ${limitInt} OFFSET ${offsetInt}
          `;

          const [files] = await pool.execute(baseQuery, queryParams);

          // 为每个文件获取标签
          for (const file of files) {
            const [tags] = await pool.execute(
              'SELECT tag FROM file_tags WHERE file_id = ?',
              [file.id]
            );
            file.tags = tags.map(tag => tag.tag);
          }

          const countParams = [];
          if (currentUserId) {
            countParams.push(currentUserId);
          }
          countParams.push(...params);

          const [totalResult] = await pool.execute(
            `SELECT COUNT(DISTINCT uf.id) as total
             FROM user_files uf
             JOIN users u ON uf.user_id = u.id
             LEFT JOIN file_tags ft ON uf.id = ft.file_id
             WHERE (uf.visibility = 'public'${currentUserId ? ' OR uf.user_id = ?' : ''}) AND ${searchQuerySQL}`,
            countParams
          );

          return {
            files: files,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: totalResult[0]?.total || 0
            }
          };
        } catch (err) {
          console.error('搜索文件错误:', err);
          return { files: [], pagination: { page: pageNum, limit: limitNum, total: 0 } };
        }
      })()
    ]);

    res.json({
      code: 0,
      data: {
        users: usersResult.users || [],
        posts: postsResult.posts || [],
        articles: articlesResult.articles || [],
        files: filesResult.files || [],
        pagination: {
          users: usersResult.pagination || { page: pageNum, limit: limitNum, total: 0 },
          posts: postsResult.pagination || { page: pageNum, limit: limitNum, total: 0 },
          articles: articlesResult.pagination || { page: pageNum, limit: limitNum, total: 0 },
          files: filesResult.pagination || { page: pageNum, limit: limitNum, total: 0 }
        }
      },
      msg: '搜索成功'
    });

  } catch (error) {
    console.error('统一搜索错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '搜索失败',
      msg: error.message || '搜索失败'
    });
  }
});

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

      // 获取当前登录用户ID（如果有）
      const currentUserId = req.user?.id || null;

      // 获取总数
      const [totalResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM users'
      );
      const total = totalResult[0]?.total || 0;

      // 获取每个用户的技能、关注状态，并移除内部的created_at字段（不对外暴露）
      for (const user of users) {
        const [skills] = await pool.execute(
          'SELECT skill_name FROM user_skills WHERE user_id = ?',
          [user.id]
        );
        user.skills = skills.map(skill => skill.skill_name);
        
        // 检查关注状态
        if (currentUserId) {
          const [follows] = await pool.execute(
            'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
            [currentUserId, user.id]
          );
          user.isFollowing = follows.length > 0;
        } else {
          user.isFollowing = false;
        }
        
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

    // 获取当前登录用户ID（如果有）
    const currentUserId = req.user?.id || null;

    // 获取每个用户的技能、关注状态，并移除内部的created_at字段（不对外暴露）
    for (const user of users) {
      const [skills] = await pool.execute(
        'SELECT skill_name FROM user_skills WHERE user_id = ?',
        [user.id]
      );
      user.skills = skills.map(skill => skill.skill_name);
      
      // 检查关注状态
      if (currentUserId) {
        const [follows] = await pool.execute(
          'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
          [currentUserId, user.id]
        );
        user.isFollowing = follows.length > 0;
      } else {
        user.isFollowing = false;
      }
      
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
        code: 400,
        data: null,
        error: '请提供搜索关键词',
        msg: '请提供搜索关键词'
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

    const currentUserId = req.user?.id || null;
    
    // 构建主查询 - 支持当前用户查看自己的私有文件
    let baseQuery = `
      SELECT uf.*, u.username as owner_username,
             (SELECT COUNT(*) FROM file_likes fl WHERE fl.file_id = uf.id) as likeCount,
             (SELECT COUNT(*) FROM file_comments fc WHERE fc.file_id = uf.id) as commentCount
      FROM user_files uf
      JOIN users u ON uf.user_id = u.id
      LEFT JOIN file_tags ft ON uf.id = ft.file_id
      WHERE (uf.visibility = 'public'${currentUserId ? ' OR uf.user_id = ?' : ''}) AND ${searchQuery}
    `;

    // 构建参数数组
    const queryParams = [];
    if (currentUserId) {
      queryParams.push(currentUserId);
    }
    queryParams.push(...params);

    if (category) {
      baseQuery += ` AND uf.category = ?`;
      queryParams.push(category);
    }

    baseQuery += ' GROUP BY uf.id ORDER BY uf.uploaded_at DESC';

    // 查询总数
    let countQuery = `
      SELECT COUNT(DISTINCT uf.id) as total
      FROM user_files uf
      JOIN users u ON uf.user_id = u.id
      LEFT JOIN file_tags ft ON uf.id = ft.file_id
      WHERE (uf.visibility = 'public'${currentUserId ? ' OR uf.user_id = ?' : ''}) AND ${searchQuery}
    `;

    if (category) {
      countQuery += ` AND uf.category = ?`;
    }

    // countQuery的参数数组
    const countParams = [];
    if (currentUserId) {
      countParams.push(currentUserId);
    }
    countParams.push(...params);
    
    if (category) {
      countParams.push(category);
    }

    const [totalResult] = await pool.execute(countQuery, countParams);
    const total = totalResult[0].total;

    // 添加分页（使用字符串插值避免参数类型问题）
    const limitInt = parseInt(limit) || 20;
    const offsetInt = (parseInt(page) - 1) * limitInt;
    const paginatedQuery = `${baseQuery} LIMIT ${limitInt} OFFSET ${offsetInt}`;

    const [files] = await pool.execute(paginatedQuery, queryParams);

    // 为每个文件获取标签
    for (const file of files) {
      const [tags] = await pool.execute(
        'SELECT tag FROM file_tags WHERE file_id = ?',
        [file.id]
      );
      file.tags = tags.map(tag => tag.tag);
    }

    res.json({
      code: 0,
      data: {
      files,
        pagination: {
      page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      },
      msg: '搜索成功'
    });

  } catch (error) {
    console.error('搜索文件错误:', error);
    res.status(500).json({
      code: 500,
      data: null,
      error: '搜索失败',
      msg: error.message || '搜索失败'
    });
  }
});

/**
 * @route   GET /api/search/posts
 * @desc    搜索帖子
 * @access  Public
 */
router.get('/posts', optionalAuth, async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        code: 400,
        error: '请提供搜索关键词'
      });
    }

    const currentUserId = req.user?.id || null;

    const { getPosts } = await import('../services/postService.js');
    const result = await getPosts({
      page: parseInt(page),
      limit: parseInt(limit),
      visibility: 'public',
      currentUserId,
      search: query
    });

    res.json({
      code: 0,
      data: result,
      msg: '搜索成功'
    });

  } catch (error) {
    console.error('搜索帖子错误:', error);
    res.status(500).json({
      code: 500,
      error: '搜索失败',
      msg: error.message || '搜索失败'
    });
  }
});

/**
 * @route   GET /api/search/articles
 * @desc    搜索文章
 * @access  Public
 */
router.get('/articles', optionalAuth, async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        code: 400,
        error: '请提供搜索关键词'
      });
    }

    const currentUserId = req.user?.id || null;

    const { getArticles } = await import('../services/articleService.js');
    const result = await getArticles({
      page: parseInt(page),
      limit: parseInt(limit),
      visibility: 'public',
      currentUserId,
      search: query
    });

    res.json({
      code: 0,
      data: result,
      msg: '搜索成功'
    });

  } catch (error) {
    console.error('搜索文章错误:', error);
    res.status(500).json({
      code: 500,
      error: '搜索失败',
      msg: error.message || '搜索失败'
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
      suggestions: {
      users: users.map(u => ({
        type: 'user',
        value: u.username,
        label: u.username
      }))
      }
    };

    res.json({
      code: 0,
      data: suggestions,
      msg: '获取成功'
    });

  } catch (error) {
    console.error('获取搜索建议错误:', error);
    res.status(500).json({
      error: '获取搜索建议失败'
    });
  }
});

export default router;
