/**
 * 数组和对象工具函数
 */

/**
 * 从数组中移除重复项
 * @param {Array} array - 要去重的数组
 * @param {string|Function} key - 用于比较的键名或比较函数
 * @returns {Array} 去重后的新数组
 */
export const uniqBy = (array, key) => {
  if (!Array.isArray(array)) return [];
  
  if (typeof key === 'string') {
    // 使用对象属性作为唯一标识
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  } else if (typeof key === 'function') {
    // 使用函数返回值作为唯一标识
    const seen = new Set();
    return array.filter(item => {
      const value = key(item);
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  } else {
    // 使用默认去重
    return [...new Set(array)];
  }
};

/**
 * 深度克隆对象
 * @param {any} obj - 要克隆的对象
 * @returns {any} 克隆后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
};

/**
 * 安全获取嵌套对象属性值
 * @param {object} obj - 源对象
 * @param {string} path - 属性路径，如 'user.profile.name'
 * @param {*} defaultValue - 默认值
 * @returns {*} 属性值或默认值
 */
export const getNestedValue = (obj, path, defaultValue = undefined) => {
  if (!obj || typeof obj !== 'object' || typeof path !== 'string') {
    return defaultValue;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
};

/**
 * 将数组按指定大小分块
 * @param {Array} array - 要分块的数组
 * @param {number} size - 每块的大小
 * @returns {Array<Array>} 分块后的数组
 */
export const chunkArray = (array, size = 1) => {
  if (!Array.isArray(array) || size <= 0) return [];
  
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

/**
 * 洗牌算法打乱数组
 * @param {Array} array - 要打乱的数组
 * @returns {Array} 打乱后的新数组
 */
export const shuffleArray = (array) => {
  if (!Array.isArray(array)) return [];
  
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * 对象属性重命名
 * @param {object} obj - 源对象
 * @param {object} mapping - 属性映射 { oldName: newName }
 * @returns {object} 重命名后的新对象
 */
export const renameKeys = (obj, mapping) => {
  if (!obj || typeof obj !== 'object' || !mapping || typeof mapping !== 'object') {
    return obj;
  }

  return Object.keys(obj).reduce((acc, key) => {
    const newKey = mapping[key] || key;
    acc[newKey] = obj[key];
    return acc;
  }, {});
};

/**
 * 过滤对象属性
 * @param {object} obj - 源对象
 * @param {Array|string|Function} keys - 要保留的键名数组、单个键名或过滤函数
 * @returns {object} 过滤后的新对象
 */
export const pick = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return {};
  
  if (typeof keys === 'function') {
    return Object.keys(obj).reduce((acc, key) => {
      if (keys(obj[key], key, obj)) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }
  
  const keyArray = Array.isArray(keys) ? keys : [keys];
  return keyArray.reduce((acc, key) => {
    if (obj.hasOwnProperty(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * 排除对象属性
 * @param {object} obj - 源对象
 * @param {Array|string|Function} keys - 要排除的键名数组、单个键名或排除函数
 * @returns {object} 排除后的新对象
 */
export const omit = (obj, keys) => {
  if (!obj || typeof obj !== 'object') return {};
  
  if (typeof keys === 'function') {
    return Object.keys(obj).reduce((acc, key) => {
      if (!keys(obj[key], key, obj)) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }
  
  const keyArray = Array.isArray(keys) ? keys : [keys];
  return Object.keys(obj).reduce((acc, key) => {
    if (!keyArray.includes(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};