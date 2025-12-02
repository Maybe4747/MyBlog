import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 确保dotenv已配置
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// MySQL连接池配置
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'career_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// MongoDB连接配置
const mongoConfig = {
  uri: process.env.MONGO_URI || 'mongodb://localhost:27017/career_platform',
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
};

// Redis配置
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: 0
};

// Elasticsearch配置
const esConfig = {
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_USERNAME ? {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  } : undefined
};

let mysqlPool;
let redisClient;
let esClient;

/**
 * 初始化MySQL连接池
 */
export const initMySQL = async () => {
  try {
    mysqlPool = mysql.createPool(mysqlConfig);

    // 测试连接
    const connection = await mysqlPool.getConnection();
    console.log('✅ MySQL连接成功');
    connection.release();

    return mysqlPool;
  } catch (error) {
    console.error('❌ MySQL连接失败:', error.message);
    throw error;
  }
};

/**
 * 初始化MongoDB连接
 */
export const initMongoDB = async () => {
  try {
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log('✅ MongoDB连接成功');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB连接已断开');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    throw error;
  }
};

/**
 * 初始化Redis连接
 */
export const initRedis = async () => {
  try {
    redisClient = createClient(redisConfig);

    await redisClient.connect();
    console.log('✅ Redis连接成功');
    return redisClient;
  } catch (error) {
    console.log('⚠️  警告: 缓存功能将不可用，请确保Redis服务正在运行');
    return null;
  }
};

/**
 * 初始化Elasticsearch连接
 */
export const initElasticsearch = async () => {
  try {
    esClient = new Client(esConfig);

    // 测试连接
    const health = await esClient.cluster.health();
    console.log('✅ Elasticsearch连接成功');

    return esClient;
  } catch (error) {
    console.error('❌ Elasticsearch连接失败:', error.message);
    console.log('⚠️  警告: 搜索功能将不可用，请确保Elasticsearch服务正在运行');
    return null;
  }
};

/**
 * 获取MySQL连接池
 */
export const getMySQLPool = () => {
  if (!mysqlPool) {
    throw new Error('MySQL连接池未初始化');
  }
  return mysqlPool;
};

/**
 * 获取Redis客户端
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * 获取Elasticsearch客户端
 */
export const getElasticsearchClient = () => {
  return esClient;
};

/**
 * 关闭所有数据库连接
 */
export const closeConnections = async () => {
  try {
    if (mysqlPool) {
      await mysqlPool.end();
      console.log('MySQL连接池已关闭');
    }

    if (redisClient) {
      try {
        await redisClient.quit();
        console.log('Redis连接已关闭');
      } catch (err) {
        console.log('Redis连接关闭跳过');
      }
    }

    if (mongoose.connection) {
      await mongoose.connection.close();
      console.log('MongoDB连接已关闭');
    }

    if (esClient) {
      await esClient.close();
      console.log('Elasticsearch连接已关闭');
    }
  } catch (error) {
    console.error('关闭数据库连接时发生错误:', error.message);
  }
};

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('\n正在关闭数据库连接...');
  await closeConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n正在关闭数据库连接...');
  await closeConnections();
  process.exit(0);
});
