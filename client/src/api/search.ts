import api from './client';

/**
 * 统一搜索接口 - 搜索所有类型（用户、帖子、文章、文件）
 */
export const searchAll = async (query: string, params: { page?: number; limit?: number } = {}) => {
  return api.get('/search', {
    params: { q: query, ...params }
  });
};

/**
 * 搜索用户
 */
export const searchUsers = async (query: string, params: { page?: number; limit?: number } = {}) => {
  return api.get('/search/users', {
    params: { q: query, ...params }
  });
};

/**
 * 搜索文件
 */
export const searchFiles = async (query: string, params: { page?: number; limit?: number; category?: string } = {}) => {
  return api.get('/search/files', {
    params: { q: query, ...params }
  });
};

/**
 * 搜索帖子
 */
export const searchPosts = async (query: string, params: { page?: number; limit?: number } = {}) => {
  return api.get('/search/posts', {
    params: { q: query, ...params }
  });
};

/**
 * 搜索文章
 */
export const searchArticles = async (query: string, params: { page?: number; limit?: number } = {}) => {
  return api.get('/search/articles', {
    params: { q: query, ...params }
  });
};

/**
 * 获取搜索建议
 */
export const getSearchSuggestions = async (query: string) => {
  return api.get('/search/suggestions', {
    params: { q: query }
  });
};
