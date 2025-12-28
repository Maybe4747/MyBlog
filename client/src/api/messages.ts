import api from './client';

/**
 * 发表留言
 */
export const addMessage = async (profileUserId, content) => {
  return api.post('/messages', { profileUserId, content });
};

/**
 * 获取用户留言列表
 */
export const getUserMessages = async (profileUserId, params = {}) => {
  return api.get(`/messages/${profileUserId}`, { params });
};

/**
 * 删除留言
 */
export const deleteMessage = async (messageId) => {
  return api.delete(`/messages/${messageId}`);
};

/**
 * 点赞留言
 */
export const likeMessage = async (messageId) => {
  return api.post(`/messages/${messageId}/like`);
};

/**
 * 取消留言点赞
 */
export const unlikeMessage = async (messageId) => {
  return api.delete(`/messages/${messageId}/like`);
};