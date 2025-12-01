import { getElasticsearchClient, getRedisClient } from '../config/database.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

let esClient;

/**
 * 初始化搜索引擎
 */
export const initSearchEngine = async () => {
  try {
    esClient = getElasticsearchClient();

    if (!esClient) {
      console.log('⚠️  Elasticsearch未配置，跳过索引初始化');
      return false;
    }

    // 创建用户索引
    const userIndexExists = await esClient.indices.exists({ index: 'users' });

    if (!userIndexExists) {
      await esClient.indices.create({
        index: 'users',
        body: {
          mappings: {
            properties: {
              userId: { type: 'integer' },
              username: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              bio: {
                type: 'text',
                analyzer: 'standard'
              },
              location: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              skills: { type: 'keyword' },
              website: { type: 'keyword' },
              createdAt: { type: 'date' },
              isActive: { type: 'boolean' }
            }
          }
        }
      });
      console.log('✅ 用户索引创建成功');
    }

    // 创建文件索引
    const fileIndexExists = await esClient.indices.exists({ index: 'files' });

    if (!fileIndexExists) {
      await esClient.indices.create({
        index: 'files',
        body: {
          mappings: {
            properties: {
              fileId: { type: 'keyword' },
              userId: { type: 'integer' },
              username: { type: 'keyword' },
              title: {
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              description: {
                type: 'text',
                analyzer: 'standard'
              },
              originalName: {
                type: 'text',
                analyzer: 'standard'
              },
              tags: { type: 'keyword' },
              category: { type: 'keyword' },
              visibility: { type: 'keyword' },
              mimeType: { type: 'keyword' },
              size: { type: 'long' },
              downloadCount: { type: 'integer' },
              likeCount: { type: 'integer' },
              commentCount: { type: 'integer' },
              uploadedAt: { type: 'date' }
            }
          }
        }
      });
      console.log('✅ 文件索引创建成功');
    }

    return true;

  } catch (error) {
    console.error('初始化搜索引擎失败:', error);
    return false;
  }
};

/**
 * 索引用户数据
 */
export const indexUser = async (user) => {
  if (!esClient) return;

  try {
    await esClient.index({
      index: 'users',
      id: user.userId.toString(),
      document: {
        userId: user.userId,
        username: user.username,
        bio: user.bio || '',
        location: user.location || '',
        skills: user.skills || [],
        website: user.website || '',
        createdAt: user.createdAt,
        isActive: user.isActive
      }
    });

    await esClient.indices.refresh({ index: 'users' });
  } catch (error) {
    console.error('索引用户数据失败:', error);
  }
};

/**
 * 删除用户索引
 */
export const deleteUserIndex = async (userId) => {
  if (!esClient) return;

  try {
    await esClient.delete({
      index: 'users',
      id: userId.toString()
    });
  } catch (error) {
    console.error('删除用户索引失败:', error);
  }
};

/**
 * 索引文件数据
 */
export const indexFile = async (profile, file) => {
  if (!esClient) return;

  try {
    await esClient.index({
      index: 'files',
      id: file._id.toString(),
      document: {
        fileId: file._id.toString(),
        userId: profile.userId,
        username: profile.username || '',
        title: file.title,
        description: file.description || '',
        originalName: file.originalName,
        tags: file.tags || [],
        category: file.category,
        visibility: file.visibility,
        mimeType: file.mimeType,
        size: file.size,
        downloadCount: file.downloadCount || 0,
        likeCount: file.likes?.length || 0,
        commentCount: file.comments?.length || 0,
        uploadedAt: file.uploadedAt
      }
    });

    await esClient.indices.refresh({ index: 'files' });
  } catch (error) {
    console.error('索引文件数据失败:', error);
  }
};

/**
 * 删除文件索引
 */
export const deleteFileIndex = async (fileId) => {
  if (!esClient) return;

  try {
    await esClient.delete({
      index: 'files',
      id: fileId.toString()
    });
  } catch (error) {
    console.error('删除文件索引失败:', error);
  }
};

/**
 * 批量索引所有数据
 */
export const reindexAll = async () => {
  if (!esClient) {
    console.log('⚠️  Elasticsearch未配置，跳过重建索引');
    return;
  }

  try {
    console.log('开始重建索引...');

    // 清空现有索引
    await esClient.indices.delete({ index: ['users', 'files'] });

    // 重新创建索引
    await initSearchEngine();

    // 索引所有用户
    const users = await User.find({});
    for (const user of users) {
      await indexUser(user);
    }
    console.log(`✅ 已索引 ${users.length} 个用户`);

    // 索引所有文件
    const profiles = await Profile.find({});
    for (const profile of profiles) {
      for (const file of profile.files) {
        await indexFile(profile, file);
      }
    }
    console.log('✅ 索引重建完成');

  } catch (error) {
    console.error('重建索引失败:', error);
  }
};
