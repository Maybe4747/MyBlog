import api from './client';

/**
 * 关注用户
 */
export const followUser = async (userId) => {
  return api.post('/social/follow', { userId });
};

/**
 * 取消关注
 */
export const unfollowUser = async (userId) => {
  return api.delete(`/social/follow/${userId}`);
};

/**
 * 获取粉丝列表
 */
export const getFollowers = async (userId, params = {}) => {
  return api.get(`/social/followers/${userId}`, { params });
};

/**
 * 获取关注列表
 */
export const getFollowing = async (userId, params = {}) => {
  return api.get(`/social/following/${userId}`, { params });
};
