import api from './client';

/**
 * 获取当前用户的档案
 */
export const getMyProfile = async () => {
  return api.get('/profiles/my');
};

/**
 * 添加文件到档案
 */
export const addFile = async (fileData) => {
  const formData = new FormData();
  formData.append('title', fileData.title);
  formData.append('description', fileData.description || '');
  formData.append('visibility', fileData.visibility || 'public');
  formData.append('tags', JSON.stringify(fileData.tags || []));

  if (fileData.file) {
    formData.append('file', fileData.file);
  }

  return api.post('/profiles/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 更新文件信息
 */
export const updateFile = async (fileId, fileData) => {
  return api.put(`/profiles/files/${fileId}`, fileData);
};

/**
 * 删除文件
 */
export const deleteFile = async (fileId) => {
  return api.delete(`/profiles/files/${fileId}`);
};

/**
 * 点赞文件
 */
export const likeFile = async (fileId) => {
  return api.post('/social/like', { fileId });
};

/**
 * 取消点赞
 */
export const unlikeFile = async (fileId) => {
  return api.delete(`/social/like/${fileId}`);
};

/**
 * 发表评论
 */
export const commentOnFile = async (fileId, content) => {
  return api.post('/social/comment', { fileId, content });
};
