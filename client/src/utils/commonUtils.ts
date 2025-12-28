/**
 * 通用工具函数
 */

/**
 * 防抖函数 - 在指定时间间隔内只执行最后一次调用
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间(毫秒)
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
};

/**
 * 节流函数 - 在指定时间间隔内最多执行一次
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间(毫秒)
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 等待指定时间
 * @param {number} ms - 等待时间(毫秒)
 * @returns {Promise} Promise对象
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 生成唯一ID
 * @param {string} prefix - ID前缀
 * @returns {string} 唯一ID
 */
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2);
  return `${prefix}${timestamp}${random}`;
};

/**
 * 检查是否为移动端设备
 * @returns {boolean} 是否为移动端
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * 检查是否为有效的数字
 * @param {any} value - 要检查的值
 * @returns {boolean} 是否为有效数字
 */
export const isValidNumber = (value) => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * 格式化数字，添加千位分隔符
 * @param {number} num - 要格式化的数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字字符串
 */
export const formatNumber = (num, decimals = 0) => {
  if (!isValidNumber(num)) return '0';
  
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(num * factor) / factor;
  
  const [integer, decimal] = rounded.toString().split('.');
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return decimals > 0 && decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
};

/**
 * 从URL中提取参数
 * @param {string} url - URL字符串
 * @returns {object} 参数对象
 */
export const getUrlParams = (url) => {
  const params = {};
  try {
    const urlObj = new URL(url, window.location.origin);
    for (const [key, value] of urlObj.searchParams) {
      params[key] = value;
    }
  } catch (error) {
    // 如果URL无效，尝试从当前页面URL解析
    const searchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParams) {
      params[key] = value;
    }
  }
  return params;
};

/**
 * 将对象转换为URL参数字符串
 * @param {object} params - 参数对象
 * @returns {string} URL参数字符串
 */
export const buildUrlParams = (params) => {
  if (!params || typeof params !== 'object') return '';
  
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      searchParams.append(key, params[key]);
    }
  });
  
  return searchParams.toString();
};

/**
 * 深度比较两个值是否相等
 * @param {any} a - 第一个值
 * @param {any} b - 第二个值
 * @returns {boolean} 是否相等
 */
export const deepEqual = (a, b) => {
  if (a === b) return true;
  
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (let key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  }
  
  return false;
};