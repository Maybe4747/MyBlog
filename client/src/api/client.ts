import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../utils/env';
import { ApiResponse } from '../types';
import { refreshToken as refreshTokenApi } from './auth';

// 创建axios实例
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 自动添加token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers!.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误和token过期
api.interceptors.response.use(
  (response) => {
    console.log('响应拦截器收到响应:', response);
    // 检查响应格式并返回适当的数据
    if (response.data && typeof response.data === 'object') {
      // 如果后端返回的是 { code, data, msg } 格式，则返回实际数据
      if ('code' in response.data && 'data' in response.data) {
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

      try {
        // 使用统ken 方法
        const refreshResult = await refreshTokenApi();
        const token = refreshResult.data?.token;
        if (token) {
          localStorage.setItem('token', token);
          originalRequest.headers!.Authorization = `Bearer ${token}`;
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
    return Promise.reject(new Error(error.response?.data?.error || error.message || '请求失败'));
  }
);

export default api;
