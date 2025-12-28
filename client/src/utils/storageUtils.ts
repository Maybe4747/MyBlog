/**
 * 本地存储工具函数
 */

/**
 * 从localStorage获取数据并解析
 * @param {string} key - 存储键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 解析后的数据或默认值
 */
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * 将数据序列化并存储到localStorage
 * @param {string} key - 存储键名
 * @param {*} value - 要存储的值
 */
export const setLocalStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

/**
 * 从localStorage删除指定键
 * @param {string} key - 要删除的键名
 */
export const removeLocalStorage = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};

/**
 * 清空localStorage中所有以指定前缀开头的键
 * @param {string} prefix - 键名前缀
 */
export const clearLocalStorageWithPrefix = (prefix) => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => window.localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing localStorage with prefix:', error);
  }
};

/**
 * 从sessionStorage获取数据并解析
 * @param {string} key - 存储键名
 * @param {*} defaultValue - 默认值
 * @returns {*} 解析后的数据或默认值
 */
export const getSessionStorage = (key, defaultValue = null) => {
  try {
    const item = window.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading sessionStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * 将数据序列化并存储到sessionStorage
 * @param {string} key - 存储键名
 * @param {*} value - 要存储的值
 */
export const setSessionStorage = (key, value) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting sessionStorage key "${key}":`, error);
  }
};