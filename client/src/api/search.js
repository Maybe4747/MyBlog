import api from './client';

/**
 * 搜索用户
 */
export const searchUsers = async (query, params = {}) => {
  return api.get('/search/users', {
    params: { q: query, ...params }
  });
};

/**
 * 搜索文件
 */
export const searchFiles = async (query, params = {}) => {
  return api.get('/search/files', {
    params: { q: query, ...params }
  });
};

/**
 * 获取搜索建议
 */
export const getSearchSuggestions = async (query) => {
  return api.get('/search/suggestions', {
    params: { q: query }
  });
};
