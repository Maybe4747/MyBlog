import axios from 'axios';
import api from './client';
import { API_URL } from '../utils/env';
import { LoginCredentials, RegisterData, User } from '../types';
import { ApiResponse } from '../types';

// 创建一个不带拦截器的实例用于认证请求
const authApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
// 响应拦截器 - 处理错误和token过期
authApi.interceptors.response.use(
  (response) => {
    // 检查响应格式并返回适当的数据
    if (response.data && typeof response.data === 'object') {
      // 如果后端返回的是 { code, data, msg } 格式，则返回实际数据
      if ('code' in response.data && 'data' in response.data) {
        console.log('认证响应拦截器收到响应:', response.data);
        return response.data; // 返回整个响应对象，让调用方处理
      }
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // 处理401未授权错误
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 防止无限重试

      // 尝试刷新令牌
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // 发送刷新请求
          const refreshResponse = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );

          // 更新本地存储的令牌
          const { data: { data: { token } } } = refreshResponse;
          localStorage.setItem('token', token);

          // 更新原始请求的令牌
          originalRequest.headers!.Authorization = `Bearer ${token}`;

          // 重新发送原始请求
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('令牌刷新失败:', refreshError);
      }

      // 如果刷新失败或没有刷新令牌，清除本地存储并重定向到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // 提取错误信息
    const errorMessage = error.response?.data?.error || error.message || '请求失败';
    return Promise.reject(new Error(errorMessage));
  }
);
/**
 * 用户注册
 */
export const register = async (data: RegisterData): Promise<ApiResponse<{ token: string; refreshToken?: string; user: User }>> => {
  return authApi.post('/auth/register', data);
};

/**
 * 用户登录
 */
export const login = async (data: LoginCredentials): Promise<ApiResponse<{ token: string; refreshToken?: string; user: User }>> => {
  return authApi.post('/auth/login', data);
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<ApiResponse<{ user: User }>> => {
  return api.get('/auth/me');
};

/**
 * 刷新访问令牌
 */
export const refreshToken = async (): Promise<ApiResponse<{ token: string }>> => {
  return api.post('/auth/refresh');
};

/**
 * 退出登录
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};
