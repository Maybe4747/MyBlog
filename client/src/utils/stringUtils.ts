/**
 * 字符串处理工具函数
 */

/**
 * 截断字符串并在末尾添加省略号
 * @param {string} str - 要截断的字符串
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀，默认为 '...'
 * @returns {string} 截断后的字符串
 */
export const truncate = (str, maxLength, suffix = '...') => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + suffix;
};

/**
 * 首字母大写
 * @param {string} str - 要处理的字符串
 * @returns {string} 首字母大写后的字符串
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * 驼峰命名转短横线命名
 * @param {string} str - 驼峰命名字符串
 * @returns {string} 短横线命名字符串
 */
export const camelToKebab = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * 检查是否为有效的邮箱格式
 * @param {string} email - 要验证的邮箱
 * @returns {boolean} 是否为有效邮箱
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 检查是否为有效的URL
 * @param {string} url - 要验证的URL
 * @returns {boolean} 是否为有效URL
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 生成指定长度的随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
export const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};