import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  let connection;

  try {
    console.log('正在初始化数据库...');

    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    // 创建数据库连接（不指定数据库）
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ MySQL连接成功');

    // 创建数据库
    const dbName = process.env.MYSQL_DATABASE || 'career_platform';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 '${dbName}' 创建成功`);

    // 切换到目标数据库
    await connection.query(`USE \`${dbName}\``);

    // 执行SQL脚本
    await connection.query(sql);
    console.log('✅ 数据库表结构创建成功');

    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📋 接下来您需要：');
    console.log('1. 确保 MongoDB 服务正在运行');
    console.log('2. 确保 Redis 服务正在运行');
    console.log('3. 确保 Elasticsearch 服务正在运行');
    console.log('4. 配置 .env 文件');
    console.log('5. 运行 npm run dev 启动服务器');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('MySQL连接已关闭');
    }
  }
}

// 如果直接运行此文件，则执行初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}

export default initDatabase;
