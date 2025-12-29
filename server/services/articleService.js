import { getMySQLPool } from '../config/database.js';

/**
 * 创建文章
 */
export const createArticle = async (articleData) => {
  const pool = getMySQLPool();
  
  const [result] = await pool.execute(
    `INSERT INTO articles (user_id, title, summary, content, visibility) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      articleData.userId,
      articleData.title,
      articleData.summary || null,
      articleData.content,
      articleData.visibility || 'public'
    ]
  );
  
  const articleId = result.insertId;
  
  // 返回完整的文章信息
  const [articles] = await pool.execute(
    `SELECT a.*, u.username, u.avatar, u.email
     FROM articles a
     JOIN users u ON a.user_id = u.id
     WHERE a.id = ?`,
    [articleId]
  );
  
  if (articles.length === 0) {
    return null;
  }
  
  const article = articles[0];
  
  // 获取点赞数
  const [likes] = await pool.execute(
    'SELECT COUNT(*) as count FROM article_likes WHERE article_id = ?',
    [articleId]
  );
  article.likeCount = likes[0].count;
  article.commentCount = article.comment_count || 0;
  article.readCount = article.read_count || 0;
  
  return article;
};

/**
 * 获取文章列表
 */
export const getArticles = async (options = {}) => {
  const pool = getMySQLPool();
  const { 
    userId = null, 
    page = 1, 
    limit = 20, 
    visibility = 'public',
    currentUserId = null,
    search = null
  } = options;
  
  let query = `SELECT a.*, u.username, u.avatar, u.email
               FROM articles a
               JOIN users u ON a.user_id = u.id
               WHERE 1=1`;
  const params = [];
  
  if (userId) {
    query += ' AND a.user_id = ?';
    params.push(userId);
  }
  
  if (search) {
    query += ' AND (a.title LIKE ? OR a.content LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }
  
  if (visibility) {
    if (visibility === 'public') {
      // 如果提供了 currentUserId，显示所有公开文章 + 当前用户自己的所有文章
      if (currentUserId) {
        query += ` AND (a.visibility = ? OR a.user_id = ?)`;
        params.push('public', currentUserId);
      } else {
        // 未登录用户只能看到公开文章
        query += ' AND a.visibility = ?';
        params.push('public');
      }
    } else if (visibility === 'followers' && currentUserId) {
      // 如果是关注者可见，需要检查当前用户是否关注了作者
      query += ` AND (a.visibility = ? OR 
                      (a.visibility = ? AND EXISTS (
                        SELECT 1 FROM follows WHERE follower_id = ? AND following_id = a.user_id
                      )) OR
                      a.user_id = ?)`;
      params.push('public', 'followers', currentUserId, currentUserId);
    } else if (visibility === 'private' && currentUserId) {
      // 私有文章只能自己看
      query += ' AND a.user_id = ?';
      params.push(currentUserId);
    }
  }
  
  // 计算总数（使用单独的查询，不包含LIMIT和OFFSET）
  const countQuery = query.replace(/SELECT a\.\*, u\.username, u\.avatar, u\.email/i, 'SELECT COUNT(*) as count');
  const countParams = [...params]; // 复制参数数组
  const [countResult] = await pool.execute(countQuery, countParams);
  const total = countResult[0].count;
  
  // 确保分页参数是整数类型
  const limitNum = parseInt(limit) || 20;
  const pageNum = parseInt(page) || 1;
  const offsetNum = (pageNum - 1) * limitNum;
  const limitInt = Number(limitNum);
  const offsetInt = Number(offsetNum);
  
  // 使用字符串插值处理 LIMIT 和 OFFSET，避免参数类型问题（参考search.js的实现）
  query += ` ORDER BY a.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;
  
  const [articles] = await pool.execute(query, params);
  
  // 为每篇文章获取点赞数和是否已点赞
  for (const article of articles) {
    const [likes] = await pool.execute(
      'SELECT COUNT(*) as count FROM article_likes WHERE article_id = ?',
      [article.id]
    );
    article.likeCount = likes[0].count;
    article.commentCount = article.comment_count || 0;
    article.readCount = article.read_count || 0;
    
    // 检查当前用户是否已点赞
    if (currentUserId) {
      const [userLike] = await pool.execute(
        'SELECT id FROM article_likes WHERE article_id = ? AND user_id = ?',
        [article.id, currentUserId]
      );
      article.liked = userLike.length > 0;
    } else {
      article.liked = false;
    }
  }
  
  return {
    articles,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }
  };
};

/**
 * 获取单个文章
 */
export const getArticleById = async (articleId, currentUserId = null) => {
  const pool = getMySQLPool();
  
  const [articles] = await pool.execute(
    `SELECT a.*, u.username, u.avatar, u.email
     FROM articles a
     JOIN users u ON a.user_id = u.id
     WHERE a.id = ?`,
    [articleId]
  );
  
  if (articles.length === 0) {
    return null;
  }
  
  const article = articles[0];
  
  // 增加阅读数（只有非作者本人查看时才增加）
  // 确保类型一致进行比较
  const articleUserId = parseInt(article.user_id);
  const userId = currentUserId ? parseInt(currentUserId) : null;
  
  if (userId !== null && userId === articleUserId) {
    // 作者本人查看，不增加阅读数，但显示当前阅读数
    article.readCount = article.read_count || 0;
  } else if (userId === null || userId !== articleUserId) {
    // 非作者查看或未登录用户查看，增加阅读数
    await pool.execute(
      'UPDATE articles SET read_count = read_count + 1 WHERE id = ?',
      [articleId]
    );
    article.readCount = (article.read_count || 0) + 1;
  } else {
    // 其他情况，不增加阅读数
    article.readCount = article.read_count || 0;
  }
  
  // 获取点赞数
  const [likes] = await pool.execute(
    'SELECT COUNT(*) as count FROM article_likes WHERE article_id = ?',
    [articleId]
  );
  article.likeCount = likes[0].count;
  article.commentCount = article.comment_count || 0;
  
  // 检查当前用户是否已点赞
  if (currentUserId) {
    const [userLike] = await pool.execute(
      'SELECT id FROM article_likes WHERE article_id = ? AND user_id = ?',
      [articleId, currentUserId]
    );
    article.liked = userLike.length > 0;
  } else {
    article.liked = false;
  }
  
  return article;
};

/**
 * 更新文章
 */
export const updateArticle = async (articleId, userId, updateData) => {
  const pool = getMySQLPool();
  
  // 验证文章是否属于当前用户
  const [articles] = await pool.execute(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?',
    [articleId, userId]
  );
  
  if (articles.length === 0) {
    return null;
  }
  
  const updates = [];
  const params = [];
  
  if (updateData.title !== undefined) {
    updates.push('title = ?');
    params.push(updateData.title);
  }
  
  if (updateData.summary !== undefined) {
    updates.push('summary = ?');
    params.push(updateData.summary);
  }
  
  if (updateData.content !== undefined) {
    updates.push('content = ?');
    params.push(updateData.content);
  }
  
  if (updateData.visibility !== undefined) {
    updates.push('visibility = ?');
    params.push(updateData.visibility);
  }
  
  if (updates.length === 0) {
    return await getArticleById(articleId, userId);
  }
  
  params.push(articleId);
  
  await pool.execute(
    `UPDATE articles SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return await getArticleById(articleId, userId);
};

/**
 * 删除文章
 */
export const deleteArticle = async (articleId, userId) => {
  const pool = getMySQLPool();
  
  // 验证文章是否属于当前用户
  const [articles] = await pool.execute(
    'SELECT id FROM articles WHERE id = ? AND user_id = ?',
    [articleId, userId]
  );
  
  if (articles.length === 0) {
    return false;
  }
  
  await pool.execute('DELETE FROM articles WHERE id = ?', [articleId]);
  
  return true;
};

/**
 * 点赞/取消点赞文章
 */
export const toggleArticleLike = async (articleId, userId) => {
  const pool = getMySQLPool();
  
  // 检查是否已点赞
  const [existing] = await pool.execute(
    'SELECT id FROM article_likes WHERE article_id = ? AND user_id = ?',
    [articleId, userId]
  );
  
  if (existing.length > 0) {
    // 取消点赞
    await pool.execute(
      'DELETE FROM article_likes WHERE article_id = ? AND user_id = ?',
      [articleId, userId]
    );
    
    // 更新点赞数
    await pool.execute(
      'UPDATE articles SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
      [articleId]
    );
    
    return { liked: false };
  } else {
    // 添加点赞
    await pool.execute(
      'INSERT INTO article_likes (article_id, user_id) VALUES (?, ?)',
      [articleId, userId]
    );
    
    // 更新点赞数
    await pool.execute(
      'UPDATE articles SET like_count = like_count + 1 WHERE id = ?',
      [articleId]
    );
    
    return { liked: true };
  }
};

