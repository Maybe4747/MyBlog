import { getMySQLPool } from '../config/database.js';

/**
 * 获取用户文件列表
 */
export const getUserFiles = async (userId, options = {}) => {
  const pool = getMySQLPool();
  const { page = 1, limit = 10, category, visibility = 'public' } = options;
  
  let query = `SELECT f.*, u.username as owner_username
               FROM user_files f
               JOIN users u ON f.user_id = u.id
               WHERE f.user_id = ? AND f.visibility = ?`;
  const params = [userId, visibility];
  
  if (category) {
    query += ' AND f.category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY f.uploaded_at DESC';
  
  // 计算总数
  const countQuery = query.replace('SELECT f.*, u.username as owner_username', 'SELECT COUNT(*) as count');
  const [countResult] = await pool.execute(countQuery, params);
  const total = countResult[0].count;
  
  // 添加分页
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  const [files] = await pool.execute(query, params);
  
  // 为每个文件获取标签、点赞数和评论数
  for (const file of files) {
    // 获取文件标签
    const [tags] = await pool.execute(
      'SELECT tag FROM file_tags WHERE file_id = ?',
      [file.id]
    );
    file.tags = tags.map(tag => tag.tag);
    
    // 获取点赞数
    const [likes] = await pool.execute(
      'SELECT COUNT(*) as count FROM file_likes WHERE file_id = ?',
      [file.id]
    );
    file.likeCount = likes[0].count;
    
    // 获取评论数
    const [comments] = await pool.execute(
      'SELECT COUNT(*) as count FROM file_comments WHERE file_id = ?',
      [file.id]
    );
    file.commentCount = comments[0].count;
  }
  
  return {
    files,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }
  };
};

/**
 * 获取公开文件列表
 */
export const getPublicFiles = async (options = {}) => {
  const pool = getMySQLPool();
  const { page = 1, limit = 10, category, search } = options;
  
  let query = `SELECT f.*, u.username as owner_username
               FROM user_files f
               JOIN users u ON f.user_id = u.id
               WHERE f.visibility = 'public'`;
  const params = [];
  
  if (category) {
    query += ' AND f.category = ?';
    params.push(category);
  }
  
  if (search) {
    query += ` AND (f.title LIKE ? OR f.description LIKE ? OR f.original_name LIKE ?)`;
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }
  
  query += ' ORDER BY f.uploaded_at DESC';
  
  // 计算总数
  const countQuery = query.replace('SELECT f.*, u.username as owner_username', 'SELECT COUNT(*) as count');
  const [countResult] = await pool.execute(countQuery, params);
  const total = countResult[0].count;
  
  // 添加分页
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  const [files] = await pool.execute(query, params);
  
  // 为每个文件获取标签、点赞数和评论数
  for (const file of files) {
    // 获取文件标签
    const [tags] = await pool.execute(
      'SELECT tag FROM file_tags WHERE file_id = ?',
      [file.id]
    );
    file.tags = tags.map(tag => tag.tag);
    
    // 获取点赞数
    const [likes] = await pool.execute(
      'SELECT COUNT(*) as count FROM file_likes WHERE file_id = ?',
      [file.id]
    );
    file.likeCount = likes[0].count;
    
    // 获取评论数
    const [comments] = await pool.execute(
      'SELECT COUNT(*) as count FROM file_comments WHERE file_id = ?',
      [file.id]
    );
    file.commentCount = comments[0].count;
  }
  
  return {
    files,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total
    }
  };
};

/**
 * 创建文件记录
 */
export const createFile = async (fileData) => {
  const pool = getMySQLPool();
  
  const [result] = await pool.execute(
    `INSERT INTO user_files 
     (user_id, filename, original_name, mime_type, size, category, title, description, visibility) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fileData.userId,
      fileData.filename,
      fileData.originalName,
      fileData.mimeType,
      fileData.size,
      fileData.category,
      fileData.title,
      fileData.description || null,
      fileData.visibility || 'public'
    ]
  );
  
  const fileId = result.insertId;
  
  // 插入文件标签
  if (fileData.tags && fileData.tags.length > 0) {
    const tagPromises = fileData.tags.map(tag => 
      pool.execute(
        'INSERT INTO file_tags (file_id, tag) VALUES (?, ?)',
        [fileId, tag]
      )
    );
    await Promise.all(tagPromises);
  }
  
  // 返回完整的文件信息
  const [files] = await pool.execute(
    'SELECT * FROM user_files WHERE id = ?',
    [fileId]
  );
  
  if (files.length === 0) {
    return null;
  }
  
  const file = files[0];
  
  // 获取文件标签
  const [tags] = await pool.execute(
    'SELECT tag FROM file_tags WHERE file_id = ?',
    [fileId]
  );
  file.tags = tags.map(tag => tag.tag);
  
  return file;
};

/**
 * 更新文件信息
 */
export const updateFile = async (fileId, updateData) => {
  const pool = getMySQLPool();
  
  // 构建更新查询
  const updates = [];
  const params = [];
  
  if (updateData.title !== undefined) {
    updates.push('title = ?');
    params.push(updateData.title);
  }
  if (updateData.description !== undefined) {
    updates.push('description = ?');
    params.push(updateData.description);
  }
  if (updateData.visibility !== undefined) {
    updates.push('visibility = ?');
    params.push(updateData.visibility);
  }
  if (updateData.category !== undefined) {
    updates.push('category = ?');
    params.push(updateData.category);
  }
  
  if (updates.length > 0) {
    params.push(fileId);
    await pool.execute(
      `UPDATE user_files SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }
  
  // 如果更新了标签
  if (updateData.tags !== undefined) {
    // 先删除现有标签
    await pool.execute('DELETE FROM file_tags WHERE file_id = ?', [fileId]);
    
    // 插入新标签
    if (updateData.tags && updateData.tags.length > 0) {
      const tagPromises = updateData.tags.map(tag => 
        pool.execute(
          'INSERT INTO file_tags (file_id, tag) VALUES (?, ?)',
          [fileId, tag]
        )
      );
      await Promise.all(tagPromises);
    }
  }
  
  // 返回更新后的文件信息
  const [files] = await pool.execute(
    'SELECT * FROM user_files WHERE id = ?',
    [fileId]
  );
  
  if (files.length === 0) {
    return null;
  }
  
  const file = files[0];
  
  // 获取文件标签
  const [tags] = await pool.execute(
    'SELECT tag FROM file_tags WHERE file_id = ?',
    [fileId]
  );
  file.tags = tags.map(tag => tag.tag);
  
  return file;
};

/**
 * 删除文件
 */
export const deleteFile = async (fileId, userId) => {
  const pool = getMySQLPool();
  
  // 检查文件是否属于用户
  const [files] = await pool.execute(
    'SELECT id FROM user_files WHERE id = ? AND user_id = ?',
    [fileId, userId]
  );
  
  if (files.length === 0) {
    return false; // 文件不存在或不属于该用户
  }
  
  // 删除相关的标签、点赞和评论
  await pool.execute('DELETE FROM file_tags WHERE file_id = ?', [fileId]);
  await pool.execute('DELETE FROM file_likes WHERE file_id = ?', [fileId]);
  await pool.execute('DELETE FROM file_comments WHERE file_id = ?', [fileId]);
  
  // 删除文件本身
  await pool.execute('DELETE FROM user_files WHERE id = ?', [fileId]);
  
  return true;
};

/**
 * 获取单个文件信息
 */
export const getFileById = async (fileId) => {
  const pool = getMySQLPool();
  
  const [files] = await pool.execute(
    `SELECT f.*, u.username as owner_username, u.id as owner_id
     FROM user_files f
     JOIN users u ON f.user_id = u.id
     WHERE f.id = ?`,
    [fileId]
  );
  
  if (files.length === 0) {
    return null;
  }
  
  const file = files[0];
  
  // 获取文件标签
  const [tags] = await pool.execute(
    'SELECT tag FROM file_tags WHERE file_id = ?',
    [fileId]
  );
  file.tags = tags.map(tag => tag.tag);
  
  // 获取点赞数
  const [likes] = await pool.execute(
    'SELECT COUNT(*) as count FROM file_likes WHERE file_id = ?',
    [fileId]
  );
  file.likeCount = likes[0].count;
  
  // 获取评论数
  const [comments] = await pool.execute(
    'SELECT COUNT(*) as count FROM file_comments WHERE file_id = ?',
    [fileId]
  );
  file.commentCount = comments[0].count;
  
  return file;
};

/**
 * 增加文件下载次数
 */
export const incrementDownloadCount = async (fileId) => {
  const pool = getMySQLPool();
  await pool.execute(
    'UPDATE user_files SET download_count = download_count + 1 WHERE id = ?',
    [fileId]
  );
};