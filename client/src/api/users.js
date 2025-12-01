import api from './client';

/**
 * 获取用户公开信息
 */
export const getUserProfile = async (username) => {
  return api.get(`/users/${username}`);
};

/**
 * 更新用户档案
 */
export const updateProfile = async (profileData) => {
  return api.put('/users/profile', profileData);
};

/**
 * 上传用户头像
 */
export const uploadAvatar = async (avatarUrl) => {
  return api.post('/users/avatar', { avatar: avatarUrl });
};

/**
 * 获取用户的文件列表
 */
export const getUserFiles = async (username, params = {}) => {
  return api.get(`/users/${username}/files`, { params });
};
