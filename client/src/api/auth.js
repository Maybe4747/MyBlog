import api from './client';

/**
 * 用户注册
 */
export const register = async (userData) => {
  return api.post('/auth/register', userData);
};

/**
 * 用户登录
 */
export const login = async (credentials) => {
  return api.post('/auth/login', credentials);
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async () => {
  return api.get('/auth/me');
};

/**
 * 刷新访问令牌
 */
export const refreshToken = async () => {
  return api.post('/auth/refresh');
};

/**
 * 退出登录
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
