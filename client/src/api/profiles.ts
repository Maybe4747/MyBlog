import api from './client';

/**
 * 获取当前用户的档案
 */
export const getMyProfile = async () => {
  return api.get('/profiles/my');
};

/**
 * 更新用户档案
 */
export const updateProfile = async (profileData) => {
  return api.put('/users/profile', profileData);
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
    },
    onUploadProgress: (progressEvent) => {
      if (fileData.onUploadProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        fileData.onUploadProgress(percentCompleted);
      }
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
  return api.post(`/profiles/files/${fileId}/like`);
};

/**
 * 取消点赞
 */
export const unlikeFile = async (fileId) => {
  return api.delete(`/profiles/files/${fileId}/like`);
};

/**
 * 发表评论
 */
export const commentOnFile = async (fileId, content) => {
  return api.post('/social/comment', { fileId, content });
};
