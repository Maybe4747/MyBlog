import { getMySQLPool } from '../config/database.js';

/**
 * 添加教育经历
 */
export const addUserEducation = async (userId, educationData) => {
  const pool = getMySQLPool();

  const [result] = await pool.execute(
    `INSERT INTO user_education (user_id, school, degree, major, start_date, end_date, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      educationData.school,
      educationData.degree || null,
      educationData.major || null,
      educationData.startDate,
      educationData.endDate || null,
      educationData.description || null
    ]
  );

  // 返回新创建的教育经历
  const [educations] = await pool.execute(
    `SELECT id, user_id, school, degree, major, start_date, end_date, description, created_at
     FROM user_education
     WHERE id = ?`,
    [result.insertId]
  );

  return educations[0];
};

/**
 * 更新教育经历
 */
export const updateUserEducation = async (educationId, userId, educationData) => {
  const pool = getMySQLPool();

  const [result] = await pool.execute(
    `UPDATE user_education
     SET school = ?, degree = ?, major = ?, start_date = ?, end_date = ?, description = ?
     WHERE id = ? AND user_id = ?`,
    [
      educationData.school,
      educationData.degree || null,
      educationData.major || null,
      educationData.startDate,
      educationData.endDate || null,
      educationData.description || null,
      educationId,
      userId
    ]
  );

  if (result.affectedRows === 0) {
    return null; // 未找到或无权限更新
  }

  // 返回更新后的教育经历
  const [educations] = await pool.execute(
    `SELECT id, user_id, school, degree, major, start_date, end_date, description, created_at
     FROM user_education
     WHERE id = ?`,
    [educationId]
  );

  return educations[0];
};

/**
 * 删除教育经历
 */
export const deleteUserEducation = async (educationId, userId) => {
  const pool = getMySQLPool();

  const [result] = await pool.execute(
    `DELETE FROM user_education
     WHERE id = ? AND user_id = ?`,
    [educationId, userId]
  );

  return result.affectedRows > 0;
};

/**
 * 获取用户的所有教育经历
 */
export const getUserEducations = async (userId) => {
  const pool = getMySQLPool();

  const [educations] = await pool.execute(
    `SELECT id, user_id, school, degree, major, start_date, end_date, description, created_at
     FROM user_education
     WHERE user_id = ?
     ORDER BY start_date DESC`,
    [userId]
  );

  return educations;
};

/**
 * 获取特定教育经历
 */
export const getUserEducationById = async (educationId, userId) => {
  const pool = getMySQLPool();

  const [educations] = await pool.execute(
    `SELECT id, user_id, school, degree, major, start_date, end_date, description, created_at
     FROM user_education
     WHERE id = ? AND user_id = ?`,
    [educationId, userId]
  );

  return educations[0] || null;
};