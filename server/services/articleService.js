import { getMySQLPool } from '../config/database.js';
import { createNotification, getUsername } from '../utils/notificationHelper.js';

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
    
    // 获取最新的点赞数
    const [articles] = await pool.execute(
      'SELECT like_count FROM articles WHERE id = ?',
      [articleId]
    );
    
    return { 
      liked: false,
      likeCount: articles[0]?.like_count || 0
    };
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
    
    // 获取文章信息以创建通知
    const [articles] = await pool.execute(
      'SELECT user_id, like_count FROM articles WHERE id = ?',
      [articleId]
    );
    
    const articleOwnerId = articles[0]?.user_id;
    const likeCount = articles[0]?.like_count || 0;
    
    // 创建通知（如果文章作者不是点赞者本人）
    if (articleOwnerId && articleOwnerId !== userId) {
      const username = await getUsername(userId);
      await createNotification(
        articleOwnerId,
        'like',
        '新的点赞',
        `${username || '某用户'} 点赞了你的文章`,
        userId,
        username,
        'article',
        articleId
      );
    }
    
    return { 
      liked: true,
      likeCount: likeCount
    };
  }
};

/**
 * 添加文章评论
 */
export const addArticleComment = async (articleId, userId, content) => {
  const pool = getMySQLPool();
  
  const [result] = await pool.execute(
    `INSERT INTO article_comments (article_id, user_id, content) 
     VALUES (?, ?, ?)`,
    [articleId, userId, content]
  );
  
  const commentId = result.insertId;
  
  // 更新文章评论数
  await pool.execute(
    'UPDATE articles SET comment_count = comment_count + 1 WHERE id = ?',
    [articleId]
  );
  
  // 获取完整的评论信息和文章信息
  const [comments] = await pool.execute(
    `SELECT ac.*, u.username, u.avatar
     FROM article_comments ac
     JOIN users u ON ac.user_id = u.id
     WHERE ac.id = ?`,
    [commentId]
  );
  
  // 获取文章信息以创建通知
  const [articles] = await pool.execute(
    'SELECT user_id FROM articles WHERE id = ?',
    [articleId]
  );
  
  const articleOwnerId = articles[0]?.user_id;
  const comment = comments[0];
  
  // 创建通知（如果文章作者不是评论者本人）
  if (articleOwnerId && articleOwnerId !== userId && comment) {
    const contentPreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
    await createNotification(
      articleOwnerId,
      'comment',
      '新的评论',
      `${comment.username || '某用户'} 评论了你的文章: "${contentPreview}"`,
      userId,
      comment.username,
      'article',
      articleId
    );
  }
  
  return comment;
};

/**
 * 获取文章评论列表
 */
export const getArticleComments = async (articleId, page = 1, limit = 10) => {
  const pool = getMySQLPool();
  
  // 先计算总数
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as count FROM article_comments WHERE article_id = ?',
    [articleId]
  );
  const total = countResult[0].count;
  
  // 确保分页参数是整数类型
  const limitNum = parseInt(limit) || 10;
  const pageNum = parseInt(page) || 1;
  const offsetNum = (pageNum - 1) * limitNum;
  const limitInt = Number(limitNum);
  const offsetInt = Number(offsetNum);
  
  // 使用字符串插值处理 LIMIT 和 OFFSET，避免参数类型问题
  const [comments] = await pool.execute(
    `SELECT ac.*, u.username, u.avatar
     FROM article_comments ac
     JOIN users u ON ac.user_id = u.id
     WHERE ac.article_id = ?
     ORDER BY ac.created_at ASC
     LIMIT ${limitInt} OFFSET ${offsetInt}`,
    [articleId]
  );
  
  return {
    comments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }
  };
};

/**
 * 删除文章评论
 */
export const deleteArticleComment = async (commentId, userId) => {
  const pool = getMySQLPool();
  
  // 获取评论信息
  const [comments] = await pool.execute(
    'SELECT article_id FROM article_comments WHERE id = ? AND user_id = ?',
    [commentId, userId]
  );
  
  if (comments.length === 0) {
    return false;
  }
  
  const articleId = comments[0].article_id;
  
  // 删除评论
  const [result] = await pool.execute(
    'DELETE FROM article_comments WHERE id = ? AND user_id = ?',
    [commentId, userId]
  );
  
  if (result.affectedRows > 0) {
    // 更新文章评论数
    await pool.execute(
      'UPDATE articles SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?',
      [articleId]
    );
    return true;
  }
  
  return false;
};

