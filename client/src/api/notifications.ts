import api from './client';

/**
 * 获取通知列表
 */
export const getNotifications = async (params = {}) => {
  return api.get('/notifications', { params });
};

/**
 * 标记通知为已读
 */
export const markNotificationsAsRead = async (notificationIds: string[] | number[], markAll = false) => {
  return api.post('/notifications/mark-read', {
    notificationIds,
    markAll
  });
};

/**
 * 删除通知
 */
export const deleteNotification = async (notificationId: string | number) => {
  return api.delete(`/notifications/${notificationId}`);
};

/**
 * 获取未读通知数量
 */
export const getUnreadCount = async () => {
  return api.get('/notifications/unread-count');
};
