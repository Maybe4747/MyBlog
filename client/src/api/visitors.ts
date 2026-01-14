import api from './client';

/**
 * 记录访客访问
 */
export const recordVisit = async (userId: number) => {
  return api.post<{ code: number; data: { recorded: boolean } }>('/visitors/record', { userId });
};

/**
 * 获取今日访客数
 */
export const getTodayVisitorCount = async (userId: number) => {
  return api.get<{ code: number; data: { count: number } }>(`/visitors/today/${userId}`);
};

/**
 * 获取总访客数
 */
export const getTotalVisitorCount = async (userId: number) => {
  return api.get<{ code: number; data: { count: number } }>(`/visitors/total/${userId}`);
};

