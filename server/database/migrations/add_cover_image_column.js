import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addCoverImageColumn() {
  let connection;

  try {
    console.log('正在添加 cover_image 列...');

    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'career_platform'
    });

    console.log('✅ MySQL连接成功');

    // 检查列是否已存在
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'cover_image'`,
      [process.env.MYSQL_DATABASE || 'career_platform']
    );

    if (columns.length > 0) {
      console.log('⏭️  列 cover_image 已存在，无需添加');
    } else {
      // 添加列
      await connection.query(
        `ALTER TABLE user_profiles 
         ADD COLUMN cover_image varchar(500) DEFAULT NULL COMMENT '背景图片URL' AFTER position`
      );
      console.log('✅ 成功添加 cover_image 列到 user_profiles 表');
    }

    // 检查 file_url 列是否已存在
    const [fileUrlColumns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_files' AND COLUMN_NAME = 'file_url'`,
      [process.env.MYSQL_DATABASE || 'career_platform']
    );

    if (fileUrlColumns.length > 0) {
      console.log('⏭️  列 file_url 已存在，无需添加');
    } else {
      // 添加列
      await connection.query(
        `ALTER TABLE user_files 
         ADD COLUMN file_url varchar(500) DEFAULT NULL COMMENT '文件URL（TOS或本地存储）' AFTER filename`
      );
      console.log('✅ 成功添加 file_url 列到 user_files 表');
    }

    console.log('\n🎉 数据库迁移完成！');

  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('MySQL连接已关闭');
    }
  }
}

// 执行迁移
addCoverImageColumn();

