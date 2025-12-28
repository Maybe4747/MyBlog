import api from './client';

/**
 * 获取用户活动流
 */
export const getUserActivity = async (username: string, params: { limit?: number; offset?: number } = {}) => {
  return api.get(`/users/${username}/activity`, { params });
};

/**
 * 获取用户文件列表
 */
export const getUserFiles = async (username: string, params: { limit?: number; offset?: number } = {}) => {
  return api.get(`/users/${username}/files`, { params });
};

/**
 * 获取用户档案
 */
export const getUserProfile = async (username: string) => {
  return api.get(`/users/${username}`);
};


/**
 * 获取当前用户档案
 */
export const getMyProfile = async () => {
  return api.get('/profiles/my');
};

/**
 * 关注用户
 */
export const followUser = async (userId: number) => {
  return api.post('/social/follow', { userId });
};

/**
 * 取消关注用户
 */
export const unfollowUser = async (userId: number) => {
  return api.delete(`/social/follow/${userId}`);
};