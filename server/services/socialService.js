import { getMySQLPool } from '../config/database.js';

/**
 * 关注用户
 */
export const followUser = async (followerId, followingId) => {
  const pool = getMySQLPool();
  
  try {
    const [result] = await pool.execute(
      `INSERT INTO follows (follower_id, following_id) 
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
      [followerId, followingId]
    );
    
    // 更新关注者的关注数和被关注者的粉丝数（如果需要的话）
    return result.affectedRows > 0;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      // 重复关注，返回true表示已经是关注状态
      return true;
    }
    throw error;
  }
};

/**
 * 取消关注用户
 */
export const unfollowUser = async (followerId, followingId) => {
  const pool = getMySQLPool();
  
  const [result] = await pool.execute(
    'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId]
  );
  
  return result.affectedRows > 0;
};

/**
 * 检查是否关注了指定用户
 */
export const isFollowing = async (followerId, followingId) => {
  const pool = getMySQLPool();
  
  const [rows] = await pool.execute(
    'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId]
  );
  
  return rows.length > 0;
};

/**
 * 获取用户关注列表
 */
export const getFollowingList = async (userId, page = 1, limit = 10) => {
  const pool = getMySQLPool();
  
  // 先计算总数
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
    [userId]
  );
  const total = countResult[0].count;
  
  const [followings] = await pool.execute(
    `SELECT u.id, u.username, u.avatar, u.created_at,
            (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
     FROM follows f
     JOIN users u ON f.following_id = u.id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
  );
  
  return {
    followings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }
  };
};

/**
 * 获取用户粉丝列表
 */
export const getFollowersList = async (userId, page = 1, limit = 10) => {
  const pool = getMySQLPool();
  
  // 先计算总数
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
    [userId]
  );
  const total = countResult[0].count;
  
  const [followers] = await pool.execute(
    `SELECT u.id, u.username, u.avatar, u.created_at,
            (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
  );
  
  return {
    followers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }
  };
};

/**
 * 点赞文件
 */
export const likeFile = async (userId, fileId) => {
  const pool = getMySQLPool();
  
  try {
    const [result] = await pool.execute(
      `INSERT INTO file_likes (user_id, file_id) 
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
      [userId, fileId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      // 重复点赞，返回true表示已经点赞
      return true;
    }
    throw error;
  }
};

/**
 * 取消点赞文件
 */
export const unlikeFile = async (userId, fileId) => {
  const pool = getMySQLPool();
  
  const [result] = await pool.execute(
    'DELETE FROM file_likes WHERE user_id = ? AND file_id = ?',
    [userId, fileId]
  );
  
  return result.affectedRows > 0;
};

/**
 * 检查是否点赞了指定文件
 */
export const hasLikedFile = async (userId, fileId) => {
  const pool = getMySQLPool();
  
  const [rows] = await pool.execute(
    'SELECT 1 FROM file_likes WHERE user_id = ? AND file_id = ?',
    [userId, fileId]
  );
  
  return rows.length > 0;
};

/**
 * 添加文件评论
 */
export const addFileComment = async (fileId, userId, content) => {
  const pool = getMySQLPool();
  
  const [result] = await pool.execute(
    `INSERT INTO file_comments (file_id, user_id, content) 
     VALUES (?, ?, ?)`,
    [fileId, userId, content]
  );
  
  const commentId = result.insertId;
  
  // 获取完整的评论信息
  const [comments] = await pool.execute(
    `SELECT fc.*, u.username, u.avatar
     FROM file_comments fc
     JOIN users u ON fc.user_id = u.id
     WHERE fc.id = ?`,
    [commentId]
  );
  
  return comments[0];
};

/**
 * 获取文件评论列表
 */
export const getFileComments = async (fileId, page = 1, limit = 10) => {
  const pool = getMySQLPool();
  
  // 先计算总数
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as count FROM file_comments WHERE file_id = ?',
    [fileId]
  );
  const total = countResult[0].count;
  
  const [comments] = await pool.execute(
    `SELECT fc.*, u.username, u.avatar
     FROM file_comments fc
     JOIN users u ON fc.user_id = u.id
     WHERE fc.file_id = ?
     ORDER BY fc.created_at ASC
     LIMIT ? OFFSET ?`,
    [fileId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
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
 * 删除文件评论
 */
export const deleteFileComment = async (commentId, userId) => {
  const pool = getMySQLPool();
  
  const [result] = await pool.execute(
    'DELETE FROM file_comments WHERE id = ? AND user_id = ?',
    [commentId, userId]
  );
  
  return result.affectedRows > 0;
};