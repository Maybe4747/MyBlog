import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');

// 确保上传目录存在
const ensureDirExists = async (dir) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// 存储配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userDir = path.join(uploadDir, req.user?.id || 'temp');
    await ensureDirExists(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

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

// 创建multer实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 默认10MB
    files: 10 // 最多同时上传10个文件
  }
});

/**
 * 单文件上传中间件
 */
export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
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
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
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
 * 生成文件访问URL
 */
export const generateFileUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const userId = req.user?.id;

  return `${protocol}://${host}/uploads/${userId}/${filename}`;
};

/**
 * 删除文件
 */
export const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
};

export default upload;
