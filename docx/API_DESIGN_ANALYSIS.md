# 接口设计分析与优化建议

## 当前设计问题分析

### 现状
目前照片、文章、文件都使用同一个接口：
- **接口**：`POST /api/profiles/files`
- **问题**：
  1. 职责不清晰：所有内容类型混在一起
  2. 性能问题：文件上传到TOS可能较慢，影响用户体验
  3. 数据模型混乱：文章被转换为Markdown文件存储
  4. 扩展性差：未来添加新内容类型需要修改现有接口

### 代码现状
```typescript
// 照片/帖子：转换为文件上传
await addFile({
  file: postData.image,
  title: postData.content.substring(0, 50),
  ...
});

// 文章：转换为Markdown文件上传
const articleContent = `# ${postData.title}\n\n...`;
const file = new File([blob], `${postData.title}.md`, { type: 'text/markdown' });
await addFile({ file, ... });
```

## 市面上常见的设计模式

### 方案1：分离接口设计（推荐）⭐

**代表产品**：Medium、Dev.to、LinkedIn

**设计思路**：
- 每种内容类型有独立的接口
- 职责清晰，易于维护和扩展

**接口设计**：
```
POST /api/posts          # 帖子/照片
POST /api/articles       # 文章
POST /api/files          # 文件上传
```

**优点**：
- ✅ 职责清晰，每个接口只处理一种内容类型
- ✅ 易于优化（文章不需要文件上传，直接存数据库）
- ✅ 易于扩展（添加新类型不影响现有接口）
- ✅ 性能更好（文章不需要上传到TOS）

**缺点**：
- ❌ 接口数量较多
- ❌ 需要维护多个接口

### 方案2：统一接口设计

**代表产品**：Twitter/X、Facebook

**设计思路**：
- 使用统一的内容接口
- 通过 `content_type` 参数区分类型

**接口设计**：
```
POST /api/content
Body: {
  type: 'post' | 'article' | 'file',
  ...
}
```

**优点**：
- ✅ 接口统一，客户端调用简单
- ✅ 便于统一处理（如审核、推荐等）

**缺点**：
- ❌ 接口逻辑复杂，需要处理多种类型
- ❌ 性能优化困难（不同类型需要不同处理）

### 方案3：混合方案

**代表产品**：GitHub、Notion

**设计思路**：
- 基础内容统一接口
- 特殊类型（如文件）独立接口

**接口设计**：
```
POST /api/posts          # 帖子、文章（统一）
POST /api/files          # 文件上传（独立）
```

## 推荐方案：分离接口设计

### 理由
1. **性能优化**：文章不需要上传到TOS，直接存数据库，响应更快
2. **数据模型清晰**：文章有独立的表结构，便于查询和索引
3. **扩展性好**：未来添加视频、音频等类型不影响现有接口
4. **维护简单**：每个接口职责单一，易于调试和优化

### 具体实现建议

#### 1. 数据库设计

```sql
-- 帖子表（包含照片）
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `content` text,
  `image_url` varchar(500),
  `visibility` enum('public','followers','private') DEFAULT 'public',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
);

-- 文章表
CREATE TABLE `articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `summary` text,
  `content` longtext NOT NULL,
  `visibility` enum('public','followers','private') DEFAULT 'public',
  `read_count` int DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  FULLTEXT KEY `idx_content` (`title`, `content`)
);
```

#### 2. 接口设计

```javascript
// routes/posts.js
POST /api/posts
Body: {
  content: string,
  image?: File,  // 可选，如果有图片
  visibility: 'public' | 'followers' | 'private'
}

// routes/articles.js
POST /api/articles
Body: {
  title: string,
  summary?: string,
  content: string,
  visibility: 'public' | 'followers' | 'private'
}

// routes/files.js (已存在，保持不变)
POST /api/files
Body: {
  file: File,
  title: string,
  description?: string,
  tags?: string[],
  visibility: 'public' | 'followers' | 'private'
}
```

#### 3. 性能优化

**帖子接口**：
- 如果有图片，先上传图片到TOS
- 然后创建帖子记录（包含图片URL）
- 可以异步处理图片压缩、生成缩略图等

**文章接口**：
- 直接存数据库，不需要文件上传
- 支持Markdown渲染
- 支持全文搜索

**文件接口**：
- 保持现有设计
- 支持大文件分片上传
- 支持断点续传

## 迁移建议

### 阶段1：添加新接口（不破坏现有功能）
1. 创建 `POST /api/posts` 接口
2. 创建 `POST /api/articles` 接口
3. 保持 `POST /api/profiles/files` 接口不变（向后兼容）

### 阶段2：前端迁移
1. 照片/帖子使用新接口
2. 文章使用新接口
3. 文件上传保持使用原接口

### 阶段3：数据迁移（可选）
1. 将现有的文章数据从 `user_files` 迁移到 `articles` 表
2. 将现有的帖子数据迁移到 `posts` 表

### 阶段4：清理
1. 标记旧接口为废弃（Deprecated）
2. 在文档中说明迁移路径
3. 一段时间后移除旧接口

## 性能对比

### 当前设计
- 文章发布：上传Markdown文件到TOS → 创建文件记录
- 耗时：~500-2000ms（取决于网络和TOS响应）

### 优化后设计
- 文章发布：直接插入数据库
- 耗时：~50-100ms（数据库操作）

**性能提升：10-20倍** 🚀

## 总结

**推荐采用分离接口设计**，原因：
1. 性能更好（文章不需要文件上传）
2. 职责清晰（每个接口只处理一种类型）
3. 易于扩展（添加新类型不影响现有接口）
4. 数据模型清晰（不同类型有独立的表结构）

**实施步骤**：
1. 先添加新接口（保持向后兼容）
2. 前端逐步迁移
3. 数据迁移（可选）
4. 清理旧接口

