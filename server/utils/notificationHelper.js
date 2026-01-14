import { getMySQLPool } from '../config/database.js';

/**
 * 创建通知
 * @param {number} userId - 接收通知的用户ID
 * @param {string} type - 通知类型 (like, comment, follow, message, system)
 * @param {string} title - 通知标题
 * @param {string} content - 通知内容
 * @param {number} fromUserId - 发送通知的用户ID（可选）
 * @param {string} fromUsername - 发送通知的用户名（可选）
 * @param {string} relatedType - 关联类型 (file, post, article, message)（可选）
 * @param {number} relatedId - 关联ID（可选）
 */
export const createNotification = async (
  userId,
  type,
  title,
  content,
  fromUserId = null,
  fromUsername = null,
  relatedType = null,
  relatedId = null
) => {
  const pool = getMySQLPool();
  
  try {
    // 如果通知接收者和发送者是同一个人，不创建通知
    if (fromUserId && userId === fromUserId) {
      return null;
    }

    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, type, title, content, from_user_id, from_username, related_type, related_id, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [userId, type, title, content, fromUserId, fromUsername, relatedType, relatedId]
    );

    return result.insertId;
  } catch (error) {
    console.error('创建通知错误:', error);
    // 不抛出错误，避免影响主流程
    return null;
  }
};

/**
 * 获取用户名
 */
export const getUsername = async (userId) => {
  const pool = getMySQLPool();
  
  try {
    const [users] = await pool.execute(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );
    
    return users.length > 0 ? users[0].username : null;
  } catch (error) {
    console.error('获取用户名错误:', error);
    return null;
  }
};

