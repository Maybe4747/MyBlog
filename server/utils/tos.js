/**
 * 火山引擎对象存储（TOS）服务
 * 用于上传文件到火山引擎对象存储并返回URL
 */

import { TosClient } from '@volcengine/tos-sdk';
import path from 'path';
import crypto from 'crypto';

// 从环境变量获取配置（去除首尾空格）
const TOS_CONFIG = {
  accessKeyId: process.env.TOS_ACCESS_KEY_ID?.trim(),
  accessKeySecret: process.env.TOS_ACCESS_KEY_SECRET?.trim(),
  region: (process.env.TOS_REGION || 'cn-beijing').trim(), // 默认北京区域
  endpoint: process.env.TOS_ENDPOINT?.trim(), // 例如: tos-cn-beijing.volces.com
  bucket: process.env.TOS_BUCKET_NAME?.trim(),
};

// 创建TOS客户端
let tosClient = null;

const getTOSClient = () => {
  if (!tosClient) {
    if (!TOS_CONFIG.accessKeyId || !TOS_CONFIG.accessKeySecret || !TOS_CONFIG.bucket) {
      throw new Error('火山引擎TOS配置不完整，请检查环境变量：TOS_ACCESS_KEY_ID, TOS_ACCESS_KEY_SECRET, TOS_BUCKET_NAME');
    }

    // 处理endpoint格式
    let endpoint = TOS_CONFIG.endpoint;
    if (!endpoint) {
      // 如果没有配置endpoint，根据region生成默认endpoint
      endpoint = `tos-${TOS_CONFIG.region}.volces.com`;
    } else {
      // 移除endpoint中的协议前缀（如果有）
      endpoint = endpoint.replace(/^https?:\/\//, '');
      // 移除bucket名称前缀（如果有，格式可能是 bucket.endpoint）
      const parts = endpoint.split('.');
      if (parts.length > 3 && parts[0] === TOS_CONFIG.bucket) {
        endpoint = parts.slice(1).join('.');
      }
    }

    // 处理Secret Access Key
    // 注意：火山引擎的Secret Access Key应该直接使用原始值
    // 如果控制台显示的是base64编码的，需要手动解码后再配置
    let accessKeySecret = TOS_CONFIG.accessKeySecret.trim();
    
    // 根据你的Secret格式，尝试解码一次（不要解码两次）
    // 你的Secret: TlRabU9EWTVOelpsWmpBNE5EVTBNbUUzWkRFeU9ERXdOVGcxTWpnM05UQQ==
    // 解码一次后: NTZmODY5NzZlZjA4NDU0MmE3ZDEyODEwNTg1Mjg3NTA (43个字符，看起来像hex)
    // 这个值可能还需要进一步处理，或者直接使用原始值
    
    // 先尝试不解码，直接使用原始值
    // 如果失败，再尝试解码一次
    console.log('Secret原始长度:', accessKeySecret.length);
    console.log('Secret前10个字符:', accessKeySecret.substring(0, 10) + '...');
    
    // 暂时不自动解码，让用户手动配置正确的值
    // 如果Secret是base64编码的，用户需要手动解码后配置

    console.log('TOS客户端配置:', {
      region: TOS_CONFIG.region,
      endpoint: endpoint,
      bucket: TOS_CONFIG.bucket,
      accessKeyId: TOS_CONFIG.accessKeyId.substring(0, 10) + '...',
      secretLength: accessKeySecret.length,
      secretPreview: accessKeySecret.substring(0, 5) + '...' + accessKeySecret.substring(accessKeySecret.length - 5)
    });
    
    console.log('⚠️  配置检查提示:');
    console.log('   1. 确认TOS_REGION与存储桶所在区域一致');
    console.log('   2. 确认TOS_BUCKET_NAME与存储桶名称一致');
    console.log('   3. 确认TOS_ACCESS_KEY_SECRET是正确的（如果是base64编码的，需要手动解码后配置）');

    tosClient = new TosClient({
      accessKeyId: TOS_CONFIG.accessKeyId.trim(),
      accessKeySecret: accessKeySecret,
      region: TOS_CONFIG.region,
      endpoint: endpoint,
    });
  }
  return tosClient;
};

/**
 * 生成唯一的文件路径
 * @param {string} userId - 用户ID
 * @param {string} originalName - 原始文件名
 * @param {string} type - 文件类型：avatar, cover, file
 * @returns {string} 文件路径
 */
const generateFilePath = (userId, originalName, type = 'file') => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  const filename = `${timestamp}-${randomStr}${ext}`;
  
  // 根据类型组织目录结构
  const typeMap = {
    avatar: 'avatars',
    cover: 'covers',
    file: 'files'
  };
  
  const folder = typeMap[type] || 'files';
  return `${folder}/${userId}/${filename}`;
};

/**
 * 上传文件到火山引擎对象存储
 * @param {Buffer|Stream} fileBuffer - 文件内容
 * @param {string} filePath - 文件在TOS中的路径
 * @param {string} contentType - 文件MIME类型
 * @returns {Promise<string>} 返回文件的公开URL
 */
export const uploadToTOS = async (fileBuffer, filePath, contentType) => {
  try {
    const client = getTOSClient();
    
    // 上传文件
    await client.putObject({
      bucket: TOS_CONFIG.bucket,
      key: filePath,
      body: fileBuffer,
      contentType: contentType,
    });

    // 生成文件的公开访问URL
    // 如果存储桶是公开的，可以直接使用这个URL
    // 如果是私有的，需要生成预签名URL或设置CORS
    let endpoint = TOS_CONFIG.endpoint;
    if (!endpoint) {
      // 如果没有配置endpoint，根据region生成默认endpoint
      endpoint = `tos-${TOS_CONFIG.region}.volces.com`;
    } else {
      // 移除endpoint中的协议前缀（如果有）
      endpoint = endpoint.replace(/^https?:\/\//, '');
      // 移除bucket名称前缀（如果有）
      const parts = endpoint.split('.');
      if (parts.length > 3 && parts[0] === TOS_CONFIG.bucket) {
        endpoint = parts.slice(1).join('.');
      }
    }
    
    // TOS的URL格式：https://bucket.endpoint/key
    const fileUrl = `https://${TOS_CONFIG.bucket}.${endpoint}/${filePath}`;
    
    return fileUrl;
  } catch (error) {
    console.error('上传文件到TOS失败:', error);
    throw new Error(`上传失败: ${error.message}`);
  }
};

/**
 * 上传用户头像
 * @param {Buffer} fileBuffer - 文件内容
 * @param {string} userId - 用户ID
 * @param {string} originalName - 原始文件名
 * @param {string} contentType - 文件MIME类型
 * @returns {Promise<string>} 返回文件的URL
 */
export const uploadAvatar = async (fileBuffer, userId, originalName, contentType) => {
  const filePath = generateFilePath(userId, originalName, 'avatar');
  return await uploadToTOS(fileBuffer, filePath, contentType);
};

/**
 * 上传背景图片
 * @param {Buffer} fileBuffer - 文件内容
 * @param {string} userId - 用户ID
 * @param {string} originalName - 原始文件名
 * @param {string} contentType - 文件MIME类型
 * @returns {Promise<string>} 返回文件的URL
 */
export const uploadCover = async (fileBuffer, userId, originalName, contentType) => {
  const filePath = generateFilePath(userId, originalName, 'cover');
  return await uploadToTOS(fileBuffer, filePath, contentType);
};

/**
 * 上传普通文件
 * @param {Buffer} fileBuffer - 文件内容
 * @param {string} userId - 用户ID
 * @param {string} originalName - 原始文件名
 * @param {string} contentType - 文件MIME类型
 * @returns {Promise<string>} 返回文件的URL
 */
export const uploadFile = async (fileBuffer, userId, originalName, contentType) => {
  const filePath = generateFilePath(userId, originalName, 'file');
  return await uploadToTOS(fileBuffer, filePath, contentType);
};

/**
 * 删除TOS中的文件
 * @param {string} fileUrl - 文件的URL
 * @returns {Promise<boolean>} 是否删除成功
 */
export const deleteFromTOS = async (fileUrl) => {
  try {
    const client = getTOSClient();
    
    // 从URL中提取文件路径
    const urlParts = fileUrl.split('/');
    const filePath = urlParts.slice(3).join('/'); // 跳过 https:// bucket.endpoint/
    
    await client.deleteObject({
      bucket: TOS_CONFIG.bucket,
      key: filePath,
    });
    
    return true;
  } catch (error) {
    console.error('从TOS删除文件失败:', error);
    return false;
  }
};

/**
 * 检查TOS配置是否完整
 */
export const checkTOSConfig = () => {
  return !!(TOS_CONFIG.accessKeyId && TOS_CONFIG.accessKeySecret && TOS_CONFIG.bucket);
};

export default {
  uploadToTOS,
  uploadAvatar,
  uploadCover,
  uploadFile,
  deleteFromTOS,
  checkTOSConfig,
};

