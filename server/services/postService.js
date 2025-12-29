import { getMySQLPool } from '../config/database.js';

/**
 * 创建帖子
 */
export const createPost = async (postData) => {
  const pool = getMySQLPool();
  
  const [result] = await pool.execute(
    `INSERT INTO posts (user_id, content, image_url, visibility) 
     VALUES (?, ?, ?, ?)`,
    [
      postData.userId,
      postData.content || null,
      postData.imageUrl || null,
      postData.visibility || 'public'
    ]
  );
  
  const postId = result.insertId;
  
  // 返回完整的帖子信息
  const [posts] = await pool.execute(
    `SELECT p.*, u.username, u.avatar, u.email
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [postId]
  );
  
  if (posts.length === 0) {
    return null;
  }
  
  const post = posts[0];
  
  // 获取点赞数
  const [likes] = await pool.execute(
    'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?',
    [postId]
  );
  post.likeCount = likes[0].count;
  post.commentCount = post.comment_count || 0;
  
  return post;
};

/**
 * 获取帖子列表
 */
export const getPosts = async (options = {}) => {
  const pool = getMySQLPool();
  const { 
    userId = null, 
    page = 1, 
    limit = 20, 
    visibility = 'public',
    currentUserId = null 
  } = options;
  
  let query = `SELECT p.*, u.username, u.avatar, u.email
               FROM posts p
               JOIN users u ON p.user_id = u.id
               WHERE 1=1`;
  const params = [];
  
  if (userId) {
    query += ' AND p.user_id = ?';
    params.push(userId);
  }
  
  if (visibility) {
    if (visibility === 'public') {
      // 如果提供了 currentUserId，显示所有公开帖子 + 当前用户自己的所有帖子
      if (currentUserId) {
        query += ` AND (p.visibility = ? OR p.user_id = ?)`;
        params.push('public', currentUserId);
      } else {
        // 未登录用户只能看到公开帖子
        query += ' AND p.visibility = ?';
        params.push('public');
      }
    } else if (visibility === 'followers' && currentUserId) {
      // 如果是关注者可见，需要检查当前用户是否关注了发布者
      query += ` AND (p.visibility = ? OR 
                      (p.visibility = ? AND EXISTS (
                        SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id
                      )) OR
                      p.user_id = ?)`;
      params.push('public', 'followers', currentUserId, currentUserId);
    } else if (visibility === 'private' && currentUserId) {
      // 私有帖子只能自己看
      query += ' AND p.user_id = ?';
      params.push(currentUserId);
    }
  }
  
  // 计算总数（使用单独的查询，不包含LIMIT和OFFSET）
  const countQuery = query.replace(/SELECT p\.\*, u\.username, u\.avatar, u\.email/i, 'SELECT COUNT(*) as count');
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
  query += ` ORDER BY p.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;
  
  const [posts] = await pool.execute(query, params);
  
  // 为每个帖子获取点赞数和是否已点赞
  for (const post of posts) {
    const [likes] = await pool.execute(
      'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?',
      [post.id]
    );
    post.likeCount = likes[0].count;
    post.commentCount = post.comment_count || 0;
    
    // 检查当前用户是否已点赞
    if (currentUserId) {
      const [userLike] = await pool.execute(
        'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
        [post.id, currentUserId]
      );
      post.liked = userLike.length > 0;
    } else {
      post.liked = false;
    }
  }
  
  return {
    posts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }
  };
};

/**
 * 获取单个帖子
 */
export const getPostById = async (postId, currentUserId = null) => {
  const pool = getMySQLPool();
  
  const [posts] = await pool.execute(
    `SELECT p.*, u.username, u.avatar, u.email
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [postId]
  );
  
  if (posts.length === 0) {
    return null;
  }
  
  const post = posts[0];
  
  // 获取点赞数
  const [likes] = await pool.execute(
    'SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?',
    [postId]
  );
  post.likeCount = likes[0].count;
  post.commentCount = post.comment_count || 0;
  
  // 检查当前用户是否已点赞
  if (currentUserId) {
    const [userLike] = await pool.execute(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, currentUserId]
    );
    post.liked = userLike.length > 0;
  } else {
    post.liked = false;
  }
  
  return post;
};

/**
 * 更新帖子
 */
export const updatePost = async (postId, userId, updateData) => {
  const pool = getMySQLPool();
  
  // 验证帖子是否属于当前用户
  const [posts] = await pool.execute(
    'SELECT id FROM posts WHERE id = ? AND user_id = ?',
    [postId, userId]
  );
  
  if (posts.length === 0) {
    return null;
  }
  
  const updates = [];
  const params = [];
  
  if (updateData.content !== undefined) {
    updates.push('content = ?');
    params.push(updateData.content);
  }
  
  if (updateData.imageUrl !== undefined) {
    updates.push('image_url = ?');
    params.push(updateData.imageUrl);
  }
  
  if (updateData.visibility !== undefined) {
    updates.push('visibility = ?');
    params.push(updateData.visibility);
  }
  
  if (updates.length === 0) {
    return await getPostById(postId, userId);
  }
  
  params.push(postId);
  
  await pool.execute(
    `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return await getPostById(postId, userId);
};

/**
 * 删除帖子
 */
export const deletePost = async (postId, userId) => {
  const pool = getMySQLPool();
  
  // 验证帖子是否属于当前用户
  const [posts] = await pool.execute(
    'SELECT id FROM posts WHERE id = ? AND user_id = ?',
    [postId, userId]
  );
  
  if (posts.length === 0) {
    return false;
  }
  
  await pool.execute('DELETE FROM posts WHERE id = ?', [postId]);
  
  return true;
};

/**
 * 点赞/取消点赞帖子
 */
export const togglePostLike = async (postId, userId) => {
  const pool = getMySQLPool();
  
  // 检查是否已点赞
  const [existing] = await pool.execute(
    'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
    [postId, userId]
  );
  
  if (existing.length > 0) {
    // 取消点赞
    await pool.execute(
      'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );
    
    // 更新点赞数
    await pool.execute(
      'UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
      [postId]
    );
    
    return { liked: false };
  } else {
    // 添加点赞
    await pool.execute(
      'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)',
      [postId, userId]
    );
    
    // 更新点赞数
    await pool.execute(
      'UPDATE posts SET like_count = like_count + 1 WHERE id = ?',
      [postId]
    );
    
    return { liked: true };
  }
};

