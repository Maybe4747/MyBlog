# 帖子与文章表迁移说明

## 概述

本次迁移添加了独立的 `posts`（帖子）和 `articles`（文章）表，将内容类型从统一的文件系统分离出来，提升性能和可维护性。

## 迁移步骤

### 1. 执行SQL迁移

运行以下SQL文件创建新表：

```bash
mysql -u your_username -p your_database < server/database/migrations/create_posts_and_articles_tables.sql
```

或者直接在MySQL客户端中执行：

```sql
source server/database/migrations/create_posts_and_articles_tables.sql;
```

### 2. 验证表结构

确认以下表已创建：
- `posts` - 帖子表
- `articles` - 文章表
- `post_likes` - 帖子点赞表
- `article_likes` - 文章点赞表

### 3. 重启服务器

重启Node.js服务器以加载新路由。

## 新接口

### 帖子接口
- `POST /api/posts` - 创建帖子
- `GET /api/posts` - 获取帖子列表
- `GET /api/posts/:postId` - 获取单个帖子
- `PUT /api/posts/:postId` - 更新帖子
- `DELETE /api/posts/:postId` - 删除帖子
- `POST /api/posts/:postId/like` - 点赞/取消点赞

### 文章接口
- `POST /api/articles` - 创建文章
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:articleId` - 获取单个文章
- `PUT /api/articles/:articleId` - 更新文章
- `DELETE /api/articles/:articleId` - 删除文章
- `POST /api/articles/:articleId/like` - 点赞/取消点赞

## 向后兼容

- 原有的 `POST /api/profiles/files` 接口仍然可用
- 前端已更新为使用新接口
- 旧数据不会自动迁移，需要手动迁移（可选）

## 性能提升

- **文章发布**：从 500-2000ms（文件上传）降至 50-100ms（数据库操作）
- **帖子发布**：图片仍上传到TOS，但帖子元数据直接存数据库
- **查询性能**：独立的表结构便于索引和优化

## 注意事项

1. 确保TOS配置正确（用于帖子图片上传）
2. 新接口需要JWT认证（除了GET请求）
3. 文章内容支持Markdown格式（前端渲染）

## 数据迁移（可选）

如果需要将现有数据从 `user_files` 迁移到新表，可以创建迁移脚本。目前暂不提供自动迁移，因为：
- 现有数据可能混合了文件、帖子、文章
- 需要人工判断内容类型
- 可以逐步迁移

