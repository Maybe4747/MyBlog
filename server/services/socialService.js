import { getMySQLPool } from '../config/database.js';
import { createNotification, getUsername } from '../utils/notificationHelper.js';

/**
 * 关注用户
 */
export const followUser = async (followerId, followingId) => {
  const pool = getMySQLPool();
  
  try {
    // 先检查是否已经关注
    const [existing] = await pool.execute(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    
    // 如果已经关注，返回 false 表示操作失败（已关注）
    if (existing.length > 0) {
      return false;
    }
    
    // 执行插入操作
    const [result] = await pool.execute(
      `INSERT INTO follows (follower_id, following_id) 
       VALUES (?, ?)`,
      [followerId, followingId]
    );
    
    // 如果成功插入（新关注），创建通知
    if (result.affectedRows === 1 && result.insertId && result.insertId > 0) {
      // 获取关注者的用户名
      const followerUsername = await getUsername(followerId);
      
      if (followerUsername) {
        // 创建通知给被关注的用户
        await createNotification(
          followingId, // 被关注的用户ID（接收通知的用户）
          'follow', // 通知类型
          '新的关注',
          `${followerUsername} 开始关注你`,
          followerId, // 关注者的用户ID
          followerUsername, // 关注者的用户名
          'profile', // 关联类型
          followingId // 关联ID（被关注的用户ID）
        );
      }
    }
    
    // 更新关注者的关注数和被关注者的粉丝数（如果需要的话）
    return result.affectedRows > 0;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      // 重复关注，返回 false 表示已经关注过
      return false;
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
 * 获取今日新增粉丝数（今天有多少人关注了我）
 */
export const getTodayNewFollowersCount = async (userId) => {
  const pool = getMySQLPool();
  
  // 获取当前时间的本地日期（考虑时区）
  // 使用 CONVERT_TZ 将 UTC 时间转换为北京时间 (UTC+8)
  // 或者直接使用服务器的本地时区
  const [result] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM follows
     WHERE following_id = ?
     AND DATE(CONVERT_TZ(created_at, '+00:00', '+08:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+08:00'))`,
    [userId]
  );

  const count = result[0]?.count || 0;
  
  // 添加调试日志
  const now = new Date();
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000); // UTC+8
  console.log('查询今日新增粉丝:', {
    userId,
    count,
    utcTime: now.toISOString(),
    beijingTime: beijingTime.toISOString(),
    beijingDate: beijingTime.toISOString().split('T')[0],
    query: 'DATE(CONVERT_TZ(created_at, "+00:00", "+08:00")) = DATE(CONVERT_TZ(NOW(), "+00:00", "+08:00"))'
  });
  
  // 同时查询一下最近几天的数据，用于调试（使用北京时间）
  const [recentFollows] = await pool.execute(
    `SELECT DATE(CONVERT_TZ(created_at, '+00:00', '+08:00')) as follow_date, COUNT(*) as count
     FROM follows
     WHERE following_id = ?
     AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY DATE(CONVERT_TZ(created_at, '+00:00', '+08:00'))
     ORDER BY follow_date DESC`,
    [userId]
  );
  
  console.log('最近7天的新增粉丝（北京时间）:', recentFollows);
  
  return count;
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
  
  // 确保分页参数是整数类型
  const limitNum = parseInt(limit) || 10;
  const pageNum = parseInt(page) || 1;
  const offsetNum = (pageNum - 1) * limitNum;
  const limitInt = Number(limitNum);
  const offsetInt = Number(offsetNum);
  
  // 使用字符串插值处理 LIMIT 和 OFFSET，避免参数类型问题
  const [followings] = await pool.execute(
    `SELECT u.id, u.username, u.avatar, u.created_at,
            up.position, up.company, up.bio,
            (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
     FROM follows f
     JOIN users u ON f.following_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC
     LIMIT ${limitInt} OFFSET ${offsetInt}`,
    [userId]
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
  
  // 确保分页参数是整数类型
  const limitNum = parseInt(limit) || 10;
  const pageNum = parseInt(page) || 1;
  const offsetNum = (pageNum - 1) * limitNum;
  const limitInt = Number(limitNum);
  const offsetInt = Number(offsetNum);
  
  // 使用字符串插值处理 LIMIT 和 OFFSET，避免参数类型问题
  const [followers] = await pool.execute(
    `SELECT u.id, u.username, u.avatar, u.created_at,
            up.position, up.company, up.bio,
            (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     LEFT JOIN user_profiles up ON u.id = up.user_id
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC
     LIMIT ${limitInt} OFFSET ${offsetInt}`,
    [userId]
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
  
  // 获取完整的评论信息和文件信息
  const [comments] = await pool.execute(
    `SELECT fc.*, u.username, u.avatar
     FROM file_comments fc
     JOIN users u ON fc.user_id = u.id
     WHERE fc.id = ?`,
    [commentId]
  );
  
  // 获取文件信息以创建通知
  const [files] = await pool.execute(
    'SELECT user_id FROM user_files WHERE id = ?',
    [fileId]
  );
  
  const fileOwnerId = files[0]?.user_id;
  const comment = comments[0];
  
  // 创建通知（如果文件所有者不是评论者本人）
  if (fileOwnerId && fileOwnerId !== userId && comment) {
    const contentPreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
    await createNotification(
      fileOwnerId,
      'comment',
      '新的评论',
      `${comment.username || '某用户'} 评论了你的文件: "${contentPreview}"`,
      userId,
      comment.username,
      'file',
      fileId
    );
  }
  
  return comment;
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
  
  // 确保分页参数是整数类型
  const limitNum = parseInt(limit) || 10;
  const pageNum = parseInt(page) || 1;
  const offsetNum = (pageNum - 1) * limitNum;
  const limitInt = Number(limitNum);
  const offsetInt = Number(offsetNum);
  
  // 使用字符串插值处理 LIMIT 和 OFFSET，避免参数类型问题
  const [comments] = await pool.execute(
    `SELECT fc.*, u.username, u.avatar
     FROM file_comments fc
     JOIN users u ON fc.user_id = u.id
     WHERE fc.file_id = ?
     ORDER BY fc.created_at ASC
     LIMIT ${limitInt} OFFSET ${offsetInt}`,
    [fileId]
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