-- ============================================
-- 个人职业资料管理平台 - 完整数据库初始化脚本
-- MySQL数据库表结构创建
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 用户表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `email` varchar(100) NOT NULL COMMENT '邮箱',
  `password` varchar(255) NOT NULL COMMENT '密码哈希',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------
-- 2. 用户档案表（扩展信息）
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user_profiles` (
  `user_id` int NOT NULL COMMENT '用户ID',
  `bio` text COMMENT '个人简介',
  `location` varchar(100) DEFAULT NULL COMMENT '所在地',
  `website` varchar(255) DEFAULT NULL COMMENT '个人网站',
  `company` varchar(100) DEFAULT NULL COMMENT '公司',
  `position` varchar(100) DEFAULT NULL COMMENT '职位',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '背景图片URL',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户档案表';

-- ----------------------------
-- 3. 用户技能表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user_skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `skill_name` varchar(100) NOT NULL COMMENT '技能名称',
  `proficiency` enum('beginner','intermediate','advanced','expert') DEFAULT 'beginner' COMMENT '熟练程度',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_skill` (`user_id`,`skill_name`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户技能表';

-- ----------------------------
-- 4. 用户经历表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user_experiences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `company` varchar(100) NOT NULL COMMENT '公司名称',
  `position` varchar(100) NOT NULL COMMENT '职位',
  `start_date` date NOT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '结束日期（NULL表示在职）',
  `description` text COMMENT '工作描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户经历表';

-- ----------------------------
-- 5. 用户教育背景表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user_education` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `school` varchar(100) NOT NULL COMMENT '学校名称',
  `degree` varchar(50) DEFAULT NULL COMMENT '学位',
  `major` varchar(100) DEFAULT NULL COMMENT '专业',
  `start_date` date NOT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '结束日期',
  `description` text COMMENT '教育描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户教育背景表';

-- ----------------------------
-- 6. 关注关系表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `follows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `follower_id` int NOT NULL COMMENT '关注者ID',
  `following_id` int NOT NULL COMMENT '被关注者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_follow` (`follower_id`,`following_id`),
  KEY `idx_follower` (`follower_id`),
  KEY `idx_following` (`following_id`),
  FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关注关系表';

-- ----------------------------
-- 7. 用户文件表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '上传者用户ID',
  `filename` varchar(255) NOT NULL COMMENT '存储的文件名',
  `file_url` varchar(500) DEFAULT NULL COMMENT '文件URL（TOS或本地存储）',
  `original_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `mime_type` varchar(100) NOT NULL COMMENT 'MIME类型',
  `size` int NOT NULL COMMENT '文件大小(字节)',
  `category` enum('document','image','video','audio','other') NOT NULL COMMENT '文件分类',
  `title` varchar(100) NOT NULL COMMENT '文件标题',
  `description` text COMMENT '文件描述',
  `visibility` enum('public','followers','private') DEFAULT 'public' COMMENT '可见性',
  `download_count` int DEFAULT 0 COMMENT '下载次数',
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category` (`category`),
  KEY `idx_visibility` (`visibility`),
  KEY `idx_uploaded_at` (`uploaded_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户文件表';

-- ----------------------------
-- 8. 文件标签表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `file_tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL COMMENT '文件ID',
  `tag` varchar(50) NOT NULL COMMENT '标签',
  PRIMARY KEY (`id`),
  UNIQUE KEY `file_tag` (`file_id`, `tag`),
  FOREIGN KEY (`file_id`) REFERENCES `user_files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件标签表';

-- ----------------------------
-- 9. 文件点赞表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `file_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL COMMENT '文件ID',
  `user_id` int NOT NULL COMMENT '点赞用户ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `file_user_like` (`file_id`, `user_id`),
  FOREIGN KEY (`file_id`) REFERENCES `user_files` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件点赞表';

-- ----------------------------
-- 10. 文件评论表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `file_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_id` int NOT NULL COMMENT '文件ID',
  `user_id` int NOT NULL COMMENT '评论用户ID',
  `content` text NOT NULL COMMENT '评论内容',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_file_id` (`file_id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`file_id`) REFERENCES `user_files` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件评论表';

-- ----------------------------
-- 11. 帖子表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '发布者用户ID',
  `content` text COMMENT '帖子内容',
  `image_url` varchar(500) DEFAULT NULL COMMENT '图片URL（如果有）',
  `visibility` enum('public','followers','private') DEFAULT 'public' COMMENT '可见性',
  `like_count` int DEFAULT 0 COMMENT '点赞数',
  `comment_count` int DEFAULT 0 COMMENT '评论数',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at` DESC),
  KEY `idx_visibility` (`visibility`),
  FULLTEXT KEY `idx_content` (`content`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';

-- ----------------------------
-- 12. 帖子点赞表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `post_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL COMMENT '帖子ID',
  `user_id` int NOT NULL COMMENT '点赞用户ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_user_like` (`post_id`, `user_id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子点赞表';

-- ----------------------------
-- 13. 文章表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '作者用户ID',
  `title` varchar(200) NOT NULL COMMENT '文章标题',
  `summary` text COMMENT '文章摘要',
  `content` longtext NOT NULL COMMENT '文章内容',
  `visibility` enum('public','followers','private') DEFAULT 'public' COMMENT '可见性',
  `read_count` int DEFAULT 0 COMMENT '阅读数',
  `like_count` int DEFAULT 0 COMMENT '点赞数',
  `comment_count` int DEFAULT 0 COMMENT '评论数',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at` DESC),
  KEY `idx_visibility` (`visibility`),
  FULLTEXT KEY `idx_title_content` (`title`, `content`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- ----------------------------
-- 14. 文章点赞表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `article_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `article_id` int NOT NULL COMMENT '文章ID',
  `user_id` int NOT NULL COMMENT '点赞用户ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `article_user_like` (`article_id`, `user_id`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章点赞表';

-- ----------------------------
-- 15. 帖子评论表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `post_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL COMMENT '帖子ID',
  `user_id` int NOT NULL COMMENT '评论用户ID',
  `content` text NOT NULL COMMENT '评论内容',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子评论表';

-- ----------------------------
-- 16. 文章评论表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `article_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `article_id` int NOT NULL COMMENT '文章ID',
  `user_id` int NOT NULL COMMENT '评论用户ID',
  `content` text NOT NULL COMMENT '评论内容',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_article_id` (`article_id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章评论表';

-- ----------------------------
-- 17. 用户留言表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '留言者ID',
  `profile_user_id` int NOT NULL COMMENT '目标用户ID（被留言的用户）',
  `content` text NOT NULL COMMENT '留言内容',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_profile_user` (`profile_user_id`),
  KEY `idx_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`profile_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户留言表';

-- ----------------------------
-- 16. 留言点赞表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `message_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL COMMENT '留言ID',
  `user_id` int NOT NULL COMMENT '点赞用户ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_user_like` (`message_id`, `user_id`),
  FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='留言点赞表';

-- ----------------------------
-- 17. 通知表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '接收通知的用户ID',
  `type` enum('like','comment','follow','mention','message','system') NOT NULL COMMENT '通知类型',
  `title` varchar(100) NOT NULL COMMENT '通知标题',
  `content` varchar(500) NOT NULL COMMENT '通知内容',
  `from_user_id` int DEFAULT NULL COMMENT '发送通知的用户ID',
  `from_username` varchar(50) DEFAULT NULL COMMENT '发送通知的用户名',
  `related_type` enum('file','comment','profile','message','post','article') DEFAULT NULL COMMENT '关联类型',
  `related_id` int DEFAULT NULL COMMENT '关联ID',
  `is_read` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已读',
  `read_at` timestamp NULL DEFAULT NULL COMMENT '阅读时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  KEY `idx_created` (`created_at` DESC),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ----------------------------
-- 18. 用户会话表（存储JWT黑名单等）
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `token_hash` varchar(255) NOT NULL COMMENT '令牌哈希',
  `refresh_token` varchar(255) DEFAULT NULL COMMENT '刷新令牌哈希',
  `refresh_token_expires` timestamp NULL DEFAULT NULL COMMENT '刷新令牌过期时间',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_user` (`user_id`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_refresh_token` (`refresh_token`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- ----------------------------
-- 19. 用户社交链接表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user_social_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `platform` varchar(50) NOT NULL COMMENT '平台名称（如github,linkedin等）',
  `url` varchar(255) NOT NULL COMMENT '链接URL',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_platform` (`user_id`, `platform`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户社交链接表';

-- ----------------------------
-- 20. 用户隐私设置表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `user_privacy_settings` (
  `user_id` int NOT NULL COMMENT '用户ID',
  `profile_visibility` enum('public','followers','private') DEFAULT 'public' COMMENT '个人资料可见性',
  `show_email` tinyint(1) DEFAULT 0 COMMENT '是否显示邮箱',
  `show_activity` tinyint(1) DEFAULT 1 COMMENT '是否显示活动',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户隐私设置表';

-- ----------------------------
-- 21. 系统配置表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL COMMENT '配置键',
  `value` text COMMENT '配置值',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ----------------------------
-- 插入默认配置
-- ----------------------------
INSERT INTO `system_configs` (`key`, `value`, `description`) VALUES
('max_file_size', '10485760', '最大文件上传大小（字节）'),
('allowed_file_types', 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif,webp,svg,mp4,mpeg,mov,webm,mp3,wav,ogg,m4a', '允许上传的文件类型'),
('jwt_expire_days', '7', 'JWT令牌过期天数'),
('items_per_page', '20', '每页显示条目数')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- ----------------------------
-- 22. 访客统计表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `visitor_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '被访问的用户ID',
  `visitor_id` int DEFAULT NULL COMMENT '访客用户ID（如果已登录）',
  `ip_address` varchar(45) DEFAULT NULL COMMENT '访客IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  `visited_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_visitor_id` (`visitor_id`),
  KEY `idx_visited_at` (`visited_at`),
  KEY `idx_user_visited` (`user_id`, `visited_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`visitor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访客统计表';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 数据库初始化完成
-- ============================================

