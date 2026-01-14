import { getMySQLPool } from '../config/database.js';

/**
 * 记录访客访问
 */
export const recordVisit = async (userId, visitorId = null, ipAddress = null, userAgent = null) => {
  const pool = getMySQLPool();
  
  try {
    await pool.execute(
      `INSERT INTO visitor_stats (user_id, visitor_id, ip_address, user_agent) 
       VALUES (?, ?, ?, ?)`,
      [userId, visitorId, ipAddress, userAgent]
    );
    return true;
  } catch (error) {
    console.error('记录访客访问错误:', error);
    return false;
  }
};

/**
 * 获取今日访客总数
 */
export const getTodayVisitorCount = async (userId) => {
  const pool = getMySQLPool();
  
  const [result] = await pool.execute(
    `SELECT COUNT(DISTINCT COALESCE(visitor_id, ip_address)) as count
     FROM visitor_stats
     WHERE user_id = ? 
     AND DATE(visited_at) = CURDATE()`,
    [userId]
  );
  
  return result[0].count || 0;
};

/**
 * 获取总访客数
 */
export const getTotalVisitorCount = async (userId) => {
  const pool = getMySQLPool();
  
  const [result] = await pool.execute(
    `SELECT COUNT(DISTINCT COALESCE(visitor_id, ip_address)) as count
     FROM visitor_stats
     WHERE user_id = ?`,
    [userId]
  );
  
  return result[0].count || 0;
};

