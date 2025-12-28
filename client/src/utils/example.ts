/**
 * 工具函数使用示例
 */

import {
  formatDateTime,
  formatDate,
  relativeTime,
  truncate,
  capitalize,
  isValidEmail,
  formatFileSize,
  getFileExtension,
  getLocalStorage,
  setLocalStorage,
  validatePassword,
  validateUsername,
  uniqBy,
  deepClone,
  debounce,
  throttle
} from './utils';

// 示例：日期格式化
console.log('当前时间:', formatDateTime(new Date()));
console.log('当前日期:', formatDate(new Date()));
console.log('相对时间:', relativeTime(Date.now() - 3600000)); // 1小时前

// 示例：字符串处理
console.log('截断字符串:', truncate('这是一个很长的字符串', 6));
console.log('首字母大写:', capitalize('hello world'));
console.log('邮箱验证:', isValidEmail('test@example.com'));

// 示例：文件处理
console.log('文件大小格式化:', formatFileSize(1024000)); // 1000 KB
console.log('获取文件扩展名:', getFileExtension('example.pdf'));

// 示例：本地存储
setLocalStorage('exampleKey', { name: '张三', age: 25 });
const userData = getLocalStorage('exampleKey');
console.log('从本地存储获取:', userData);

// 示例：验证函数
console.log('密码验证:', validatePassword('MyP@ssw0rd123'));
console.log('用户名验证:', validateUsername('myusername'));

// 示例：数组去重
const users = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 1, name: '张三' } // 重复
];
console.log('去重后:', uniqBy(users, 'id'));

// 示例：深度克隆
const originalObj = { a: 1, b: { c: 2 } };
const clonedObj = deepClone(originalObj);
console.log('原对象:', originalObj);
console.log('克隆对象:', clonedObj);
console.log('是否为不同对象:', originalObj !== clonedObj);

// 示例：防抖函数
const debouncedSearch = debounce((query) => {
  console.log(`搜索: ${query}`);
}, 300);

// 模拟快速输入
debouncedSearch('a');
debouncedSearch('ap');
debouncedSearch('app'); // 只会执行这个

// 示例：节流函数
let count = 0;
const throttledFunction = throttle(() => {
  console.log(`节流函数执行次数: ${++count}`);
}, 1000);

// 连续调用只会每秒执行一次
throttledFunction();
throttledFunction();
throttledFunction();

export {
  formatDateTime,
  formatDate,
  relativeTime,
  truncate,
  capitalize,
  isValidEmail,
  formatFileSize,
  getFileExtension,
  getLocalStorage,
  setLocalStorage,
  validatePassword,
  validateUsername,
  uniqBy,
  deepClone,
  debounce,
  throttle
};