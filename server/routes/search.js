import express from 'express';
import { getElasticsearchClient, getRedisClient } from '../config/database.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/search/users
 * @desc    搜索用户
 * @access  Public
 */
router.get('/users', optionalAuth, async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        error: '请提供搜索关键词'
      });
    }

    const esClient = getElasticsearchClient();

    // 如果 Elasticsearch 可用，使用它进行搜索
    if (esClient) {
      try {
        const result = await esClient.search({
          index: 'users',
          body: {
            query: {
              multi_match: {
                query,
                fields: ['username^3', 'bio', 'skills', 'location'],
                type: 'best_fields'
              }
            },
            highlight: {
              fields: {
                username: {},
                bio: {},
                skills: {}
              }
            },
            from: (parseInt(page) - 1) * parseInt(limit),
            size: parseInt(limit)
          }
        });

        const users = result.hits.hits.map(hit => ({
          ...hit._source,
          score: hit._score,
          highlights: hit.highlight
        }));

        return res.json({
          users,
          total: result.hits.total.value,
          page: parseInt(page),
          limit: parseInt(limit)
        });

      } catch (esError) {
        console.error('Elasticsearch搜索失败:', esError);
        // 降级到 MongoDB 搜索
      }
    }

    // MongoDB 降级搜索
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { skills: { $elemMatch: { $regex: query, $options: 'i' } } },
        { location: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
      .select('userId username avatar bio location skills socialLinks')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { skills: { $elemMatch: { $regex: query, $options: 'i' } } },
        { location: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    });

    res.json({
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({
      error: '搜索失败'
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

    const esClient = getElasticsearchClient();

    // 如果 Elasticsearch 可用，使用它进行搜索
    if (esClient) {
      try {
        const mustQuery = [{
          multi_match: {
            query,
            fields: ['title^3', 'description^2', 'tags', 'originalName'],
            type: 'best_fields'
          }
        }];

        if (category) {
          mustQuery.push({ term: { category } });
        }

        const result = await esClient.search({
          index: 'files',
          body: {
            query: {
              bool: {
                must: mustQuery,
                filter: [
                  { term: { visibility: 'public' } }
                ]
              }
            },
            highlight: {
              fields: {
                title: {},
                description: {},
                tags: {}
              }
            },
            from: (parseInt(page) - 1) * parseInt(limit),
            size: parseInt(limit)
          }
        });

        const files = result.hits.hits.map(hit => ({
          ...hit._source,
          score: hit._score,
          highlights: hit.highlight
        }));

        return res.json({
          files,
          total: result.hits.total.value,
          page: parseInt(page),
          limit: parseInt(limit)
        });

      } catch (esError) {
        console.error('Elasticsearch搜索失败:', esError);
        // 降级到 MongoDB 搜索
      }
    }

    // MongoDB 降级搜索
    const searchQuery = {
      $and: [
        { 'files.visibility': 'public' },
        {
          $or: [
            { 'files.title': { $regex: query, $options: 'i' } },
            { 'files.description': { $regex: query, $options: 'i' } },
            { 'files.tags': { $elemMatch: { $regex: query, $options: 'i' } } },
            { 'files.originalName': { $regex: query, $options: 'i' } }
          ]
        }
      ]
    };

    if (category) {
      searchQuery.$and.push({ 'files.category': category });
    }

    const profiles = await Profile.find(searchQuery)
      .select('userId files')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    // 提取匹配的文件
    let files = [];
    profiles.forEach(profile => {
      profile.files.forEach(file => {
        const matchesQuery =
          file.title.toLowerCase().includes(query.toLowerCase()) ||
          (file.description && file.description.toLowerCase().includes(query.toLowerCase())) ||
          file.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
          file.originalName.toLowerCase().includes(query.toLowerCase());

        const matchesCategory = !category || file.category === category;

        if (matchesQuery && matchesCategory) {
          files.push({
            ...file,
            ownerId: profile.userId,
            likeCount: file.likes.length,
            commentCount: file.comments.length
          });
        }
      });
    });

    const total = files.length;

    res.json({
      files: files.slice(0, parseInt(limit)),
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

    const redisClient = getRedisClient();
    const cacheKey = `search:suggestions:${query}`;

    // 尝试从缓存获取
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({ suggestions: JSON.parse(cached) });
      }
    } catch (cacheError) {
      console.log('缓存查询失败，继续数据库查询');
    }

    // 获取用户建议
    const users = await User.find({
      username: { $regex: `^${query}`, $options: 'i' },
      isActive: true
    })
      .select('username')
      .limit(5)
      .lean();

    const suggestions = {
      users: users.map(u => ({
        type: 'user',
        value: u.username,
        label: u.username
      }))
    };

    // 缓存结果（10分钟）
    try {
      await redisClient.setEx(cacheKey, 600, JSON.stringify(suggestions));
    } catch (cacheError) {
      console.log('缓存设置失败:', cacheError.message);
    }

    res.json(suggestions);

  } catch (error) {
    console.error('获取搜索建议错误:', error);
    res.status(500).json({
      error: '获取搜索建议失败'
    });
  }
});

export default router;
