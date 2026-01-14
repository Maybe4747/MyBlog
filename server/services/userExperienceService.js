import { getMySQLPool } from '../config/database.js';

/**
 * 添加工作经历
 */
export const addUserExperience = async (userId, experienceData) => {
  const pool = getMySQLPool();

  const [result] = await pool.execute(
    `INSERT INTO user_experiences (user_id, company, position, start_date, end_date, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      experienceData.company,
      experienceData.position,
      experienceData.startDate,
      experienceData.endDate || null, // NULL 表示仍在职
      experienceData.description || null
    ]
  );

  // 返回新创建的经历
  const [experiences] = await pool.execute(
    `SELECT id, user_id, company, position, start_date, end_date, description, created_at
     FROM user_experiences
     WHERE id = ?`,
    [result.insertId]
  );

  return experiences[0];
};

/**
 * 更新工作经历
 */
export const updateUserExperience = async (experienceId, userId, experienceData) => {
  const pool = getMySQLPool();

  const [result] = await pool.execute(
    `UPDATE user_experiences
     SET company = ?, position = ?, start_date = ?, end_date = ?, description = ?
     WHERE id = ? AND user_id = ?`,
    [
      experienceData.company,
      experienceData.position,
      experienceData.startDate,
      experienceData.endDate || null,
      experienceData.description || null,
      experienceId,
      userId
    ]
  );

  if (result.affectedRows === 0) {
    return null; // 未找到或无权限更新
  }

  // 返回更新后的经历
  const [experiences] = await pool.execute(
    `SELECT id, user_id, company, position, start_date, end_date, description, created_at
     FROM user_experiences
     WHERE id = ?`,
    [experienceId]
  );

  return experiences[0];
};

/**
 * 删除工作经历
 */
export const deleteUserExperience = async (experienceId, userId) => {
  const pool = getMySQLPool();

  const [result] = await pool.execute(
    `DELETE FROM user_experiences
     WHERE id = ? AND user_id = ?`,
    [experienceId, userId]
  );

  return result.affectedRows > 0;
};

/**
 * 获取用户的所有工作经历
 */
export const getUserExperiences = async (userId) => {
  const pool = getMySQLPool();

  const [experiences] = await pool.execute(
    `SELECT id, user_id, company, position, start_date, end_date, description, created_at
     FROM user_experiences
     WHERE user_id = ?
     ORDER BY 
       CASE WHEN end_date IS NULL THEN 0 ELSE 1 END ASC,
       COALESCE(end_date, start_date) DESC,
       start_date DESC`,
    [userId]
  );

  return experiences;
};

/**
 * 获取特定工作经历
 */
export const getUserExperienceById = async (experienceId, userId) => {
  const pool = getMySQLPool();

  const [experiences] = await pool.execute(
    `SELECT id, user_id, company, position, start_date, end_date, description, created_at
     FROM user_experiences
     WHERE id = ? AND user_id = ?`,
    [experienceId, userId]
  );

  return experiences[0] || null;
};