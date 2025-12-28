import mysql from 'mysql2/promise';
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




let mysqlPool;

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
 * 获取MySQL连接池
 */
export const getMySQLPool = () => {
  if (!mysqlPool) {
    throw new Error('MySQL连接池未初始化');
  }
  return mysqlPool;
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
