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
  
  // 直接传递数组，使用 tags[] 格式
  const tags = fileData.tags || [];
  tags.forEach((tag) => {
    formData.append('tags[]', tag);
  });

  if (fileData.file) {
    formData.append('file', fileData.file);
  }

  // 根据文件大小动态设置超时时间
  // 基础时间 30秒 + 每MB 2秒，最小 60秒，最大 10分钟
  const fileSizeMB = fileData.file ? fileData.file.size / (1024 * 1024) : 0;
  const timeout = Math.min(Math.max(60000, 30000 + fileSizeMB * 2000), 600000);

  return api.post('/profiles/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: timeout,
    onUploadProgress: (progressEvent) => {
      if (fileData.onUploadProgress && progressEvent.total) {
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

/**
 * 获取文件详情
 */
export const getFileById = async (fileId: number) => {
  return api.get(`/files/${fileId}`);
};
