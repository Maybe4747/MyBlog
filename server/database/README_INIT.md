# 数据库初始化说明

## 快速开始

如果不小心删除了数据库，可以使用以下方法重新创建所有表：

### 方法一：使用 SQL 脚本（推荐）

1. 确保 MySQL 服务正在运行
2. 确保数据库已创建（如果不存在，先创建数据库）：
   ```sql
   CREATE DATABASE IF NOT EXISTS career_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. 执行初始化脚本：
   ```bash
   # 方式1：使用 MySQL 命令行
   mysql -u root -p career_platform < server/database/init_database.sql
   
   # 方式2：在 MySQL 客户端中执行
   source server/database/init_database.sql
   ```

### 方法二：使用 Node.js 脚本

如果项目中有数据库初始化脚本，可以运行：
```bash
cd server
node database/init.js
```

## 脚本说明

`init_database.sql` 包含以下表：

1. **用户相关表**
   - `users` - 用户基础信息
   - `user_profiles` - 用户档案扩展信息
   - `user_skills` - 用户技能
   - `user_experiences` - 用户工作经历
   - `user_education` - 用户教育背景
   - `user_social_links` - 用户社交链接
   - `user_privacy_settings` - 用户隐私设置

2. **社交功能表**
   - `follows` - 关注关系
   - `posts` - 帖子
   - `post_likes` - 帖子点赞
   - `articles` - 文章
   - `article_likes` - 文章点赞
   - `messages` - 用户留言
   - `message_likes` - 留言点赞

3. **文件相关表**
   - `user_files` - 用户文件
   - `file_tags` - 文件标签
   - `file_likes` - 文件点赞
   - `file_comments` - 文件评论

4. **系统表**
   - `notifications` - 通知
   - `user_sessions` - 用户会话（JWT管理）
   - `system_configs` - 系统配置

## 注意事项

- 脚本使用 `CREATE TABLE IF NOT EXISTS`，如果表已存在不会报错
- 所有表都设置了外键约束，确保数据完整性
- 脚本会自动插入默认的系统配置
- 如果表已存在但结构不同，可能需要先删除表再执行脚本

## 验证

执行脚本后，可以运行以下 SQL 验证表是否创建成功：

```sql
SHOW TABLES;
```

应该看到约 21 个表。

