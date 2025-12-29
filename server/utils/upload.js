import multer from 'multer';
import path from 'path';
import { uploadAvatar, uploadCover, uploadFile, checkTOSConfig } from './tos.js';

/**
 * 文件上传工具
 * 注意：现在只支持火山引擎对象存储（TOS），不再支持本地存储
 */

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 支持的文件类型
  const allowedTypes = {
    // 文档类型
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',

    // 图片类型
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',

    // 视频类型
    'video/mp4': '.mp4',
    'video/mpeg': '.mpeg',
    'video/quicktime': '.mov',
    'video/webm': '.webm',

    // 音频类型
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/mp4': '.m4a'
  };

  const ext = allowedTypes[file.mimetype];

  if (ext) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

// 内存存储（用于上传到TOS）
const memoryStorage = multer.memoryStorage();

// 创建multer实例（只使用TOS存储）
const getUploadConfig = () => {
  // 检查TOS配置，如果不完整则抛出错误
  if (!checkTOSConfig()) {
    throw new Error('TOS配置不完整，请检查环境变量：TOS_ACCESS_KEY_ID, TOS_ACCESS_KEY_SECRET, TOS_BUCKET_NAME');
  }
  
  return {
    storage: memoryStorage, // 只使用内存存储（上传到TOS）
    fileFilter,
    limits: {
      fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 默认10MB
      files: 10 // 最多同时上传10个文件
    }
  };
};

// 创建multer实例（每次请求时动态检查配置）
export const createUploadInstance = () => {
  return multer(getUploadConfig());
};

/**
 * 单文件上传中间件
 */
export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const upload = createUploadInstance();
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        console.error('文件上传中间件错误:', err);
        return res.status(400).json({
          error: err.message,
          code: 'UPLOAD_ERROR'
        });
      }
      next();
    });
  };
};

/**
 * 多文件上传中间件
 */
export const uploadMultiple = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    const upload = createUploadInstance();
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        console.error('多文件上传中间件错误:', err);
        return res.status(400).json({
          error: err.message,
          code: 'UPLOAD_ERROR'
        });
      }
      next();
    });
  };
};

/**
 * 获取文件扩展名
 */
export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

/**
 * 获取文件类型分类
 */
export const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (mimeType.includes('pdf') || mimeType.includes('document') ||
             mimeType.includes('word') || mimeType.includes('excel') ||
             mimeType.includes('powerpoint') || mimeType.includes('text')) {
    return 'document';
  } else {
    return 'other';
  }
};

/**
 * 处理文件上传到TOS
 * @param {Object} file - multer文件对象
 * @param {string} userId - 用户ID
 * @param {string} type - 文件类型：avatar, cover, file
 * @returns {Promise<string>} 返回文件URL
 */
export const processFileUpload = async (file, userId, type = 'file') => {
  // 检查TOS配置
  if (!checkTOSConfig()) {
    throw new Error('TOS配置不完整，请检查环境变量：TOS_ACCESS_KEY_ID, TOS_ACCESS_KEY_SECRET, TOS_BUCKET_NAME');
  }
  
  // 使用火山引擎TOS
  if (!file.buffer) {
    throw new Error('文件数据不存在，请确保使用正确的上传中间件');
  }
  
  const fileBuffer = file.buffer;
  const originalName = file.originalname;
  const contentType = file.mimetype;

  try {
    switch (type) {
      case 'avatar':
        return await uploadAvatar(fileBuffer, userId, originalName, contentType);
      case 'cover':
        return await uploadCover(fileBuffer, userId, originalName, contentType);
      default:
        return await uploadFile(fileBuffer, userId, originalName, contentType);
    }
  } catch (error) {
    console.error(`上传${type}到TOS失败:`, error);
    
    // 如果是签名错误，提供更详细的提示
    if (error.code === 'SignatureDoesNotMatch' || error.message?.includes('signature')) {
      console.error('TOS签名验证失败，请检查：');
      console.error('1. TOS_ACCESS_KEY_ID 和 TOS_ACCESS_KEY_SECRET 是否正确');
      console.error('2. TOS_REGION 是否与存储桶所在区域一致');
      console.error('3. TOS_ENDPOINT 格式是否正确（应为: tos-{region}.volces.com）');
      throw new Error(`TOS配置错误: ${error.message}。请检查AccessKey和区域配置。`);
    }
    
    throw new Error(`上传到对象存储失败: ${error.message}`);
  }
};

/**
 * 删除文件（从TOS删除）
 * 注意：此函数已废弃，请使用TOS服务的deleteFromTOS函数
 */
export const deleteFile = async (filePath) => {
  console.warn('deleteFile函数已废弃，请使用TOS服务的deleteFromTOS函数');
  // 如果需要删除TOS中的文件，应该使用 deleteFromTOS(fileUrl)
  return false;
};

// 不再导出默认实例，因为所有上传都通过 uploadSingle 和 uploadMultiple 中间件处理
