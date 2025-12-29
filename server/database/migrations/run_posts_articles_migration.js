import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  let connection;

  try {
    console.log('正在执行数据库迁移（创建posts和articles表）...');

    // 读取SQL文件
    const sqlPath = path.join(__dirname, 'create_posts_and_articles_tables.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'career_platform',
      multipleStatements: true
    });

    console.log('✅ MySQL连接成功');

    // 执行SQL脚本
    // 将SQL按分号分割，逐个执行
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          // 检查表是否已存在
          if (statement.includes('CREATE TABLE')) {
            const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i);
            
            if (tableMatch) {
              const table = tableMatch[1];
              
              // 检查表是否已存在
              const [tables] = await connection.query(
                `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
                [process.env.MYSQL_DATABASE || 'career_platform', table]
              );
              
              if (tables.length > 0) {
                console.log(`⏭️  表 ${table} 已存在，跳过`);
                continue;
              }
            }
          }
          
          await connection.query(statement + ';');
          const desc = statement.replace(/\s+/g, ' ').substring(0, 60);
          console.log(`✅ 执行成功: ${desc}...`);
        } catch (error) {
          // 如果错误是表已存在，则跳过
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
            const desc = statement.replace(/\s+/g, ' ').substring(0, 60);
            console.log(`⏭️  已存在或已执行，跳过: ${desc}...`);
            continue;
          }
          throw error;
        }
      }
    }

    console.log('\n🎉 数据库迁移完成！');
    console.log('✅ 已创建以下表：');
    console.log('   - posts (帖子表)');
    console.log('   - articles (文章表)');
    console.log('   - post_likes (帖子点赞表)');
    console.log('   - article_likes (文章点赞表)');

  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nMySQL连接已关闭');
    }
  }
}

// 如果直接运行此文件，则执行迁移
runMigration();

