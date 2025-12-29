import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createTables() {
  let connection;

  try {
    console.log('正在创建posts和articles表...');

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

    // 创建posts表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`posts\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NOT NULL COMMENT '发布者用户ID',
        \`content\` text COMMENT '帖子内容',
        \`image_url\` varchar(500) DEFAULT NULL COMMENT '图片URL（如果有）',
        \`visibility\` enum('public','followers','private') DEFAULT 'public' COMMENT '可见性',
        \`like_count\` int DEFAULT 0 COMMENT '点赞数',
        \`comment_count\` int DEFAULT 0 COMMENT '评论数',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_created_at\` (\`created_at\` DESC),
        KEY \`idx_visibility\` (\`visibility\`),
        FULLTEXT KEY \`idx_content\` (\`content\`),
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';
    `);
    console.log('✅ posts表创建成功');

    // 创建articles表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`articles\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`user_id\` int NOT NULL COMMENT '作者用户ID',
        \`title\` varchar(200) NOT NULL COMMENT '文章标题',
        \`summary\` text COMMENT '文章摘要',
        \`content\` longtext NOT NULL COMMENT '文章内容',
        \`visibility\` enum('public','followers','private') DEFAULT 'public' COMMENT '可见性',
        \`read_count\` int DEFAULT 0 COMMENT '阅读数',
        \`like_count\` int DEFAULT 0 COMMENT '点赞数',
        \`comment_count\` int DEFAULT 0 COMMENT '评论数',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_created_at\` (\`created_at\` DESC),
        KEY \`idx_visibility\` (\`visibility\`),
        FULLTEXT KEY \`idx_title_content\` (\`title\`, \`content\`),
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';
    `);
    console.log('✅ articles表创建成功');

    // 创建post_likes表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`post_likes\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`post_id\` int NOT NULL COMMENT '帖子ID',
        \`user_id\` int NOT NULL COMMENT '点赞用户ID',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`post_user_like\` (\`post_id\`, \`user_id\`),
        KEY \`idx_post_id\` (\`post_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子点赞表';
    `);
    console.log('✅ post_likes表创建成功');

    // 创建article_likes表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`article_likes\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`article_id\` int NOT NULL COMMENT '文章ID',
        \`user_id\` int NOT NULL COMMENT '点赞用户ID',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`article_user_like\` (\`article_id\`, \`user_id\`),
        KEY \`idx_article_id\` (\`article_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        FOREIGN KEY (\`article_id\`) REFERENCES \`articles\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章点赞表';
    `);
    console.log('✅ article_likes表创建成功');

    // 验证表是否存在
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('posts', 'articles', 'post_likes', 'article_likes')
    `, [process.env.MYSQL_DATABASE || 'career_platform']);

    console.log('\n📋 已创建的表：');
    tables.forEach(table => {
      console.log(`   ✅ ${table.TABLE_NAME}`);
    });

    console.log('\n🎉 所有表创建成功！');

  } catch (error) {
    console.error('❌ 创建表失败:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    console.error('完整错误:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nMySQL连接已关闭');
    }
  }
}

// 执行创建
createTables();

