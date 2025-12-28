/**
 * 文件处理工具函数
 */

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小(字节)
 * @param {number} decimals - 小数位数，默认为2
 * @returns {string} 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 文件扩展名(不包含点号)
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.substring(lastDotIndex + 1).toLowerCase();
};

/**
 * 获取文件类型图标
 * @param {string} filename - 文件名
 * @returns {string} 文件类型对应的图标名称(lucide-react)
 */
export const getFileTypeIcon = (filename) => {
  if (!filename || typeof filename !== 'string') return 'file';
  
  const ext = getFileExtension(filename);
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'json', 'xml'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'music';
  if (docExts.includes(ext)) return 'file-text';
  if (codeExts.includes(ext)) return 'code';
  
  return 'file';
};

/**
 * 检查文件类型是否为图片
 * @param {string} filename - 文件名
 * @returns {boolean} 是否为图片
 */
export const isImageFile = (filename) => {
  if (!filename || typeof filename !== 'string') return false;
  const ext = getFileExtension(filename);
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  return imageExts.includes(ext);
};

/**
 * 检查文件类型是否为视频
 * @param {string} filename - 文件名
 * @returns {boolean} 是否为视频
 */
export const isVideoFile = (filename) => {
  if (!filename || typeof filename !== 'string') return false;
  const ext = getFileExtension(filename);
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  return videoExts.includes(ext);
};

/**
 * 从File对象获取预览URL
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 预览URL的Promise
 */
export const getFilePreviewUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new Error('Invalid file'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};