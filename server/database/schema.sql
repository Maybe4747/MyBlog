-- 成都锦城学院 - 个人职业资料管理平台数据库表结构
-- MySQL数据库初始化脚本

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 用户表
-- ----------------------------
CREATE TABLE `users` (
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
-- 用户档案表（扩展信息）
-- ----------------------------
CREATE TABLE `user_profiles` (
  `user_id` int NOT NULL COMMENT '用户ID',
  `bio` text COMMENT '个人简介',
  `location` varchar(100) DEFAULT NULL COMMENT '所在地',
  `website` varchar(255) DEFAULT NULL COMMENT '个人网站',
  `company` varchar(100) DEFAULT NULL COMMENT '公司',
  `position` varchar(100) DEFAULT NULL COMMENT '职位',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户档案表';

-- ----------------------------
-- 用户技能表
-- ----------------------------
CREATE TABLE `user_skills` (
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
-- 用户经历表
-- ----------------------------
CREATE TABLE `user_experiences` (
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
-- 用户教育背景表
-- ----------------------------
CREATE TABLE `user_education` (
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
-- 关注关系表
-- ----------------------------
CREATE TABLE `follows` (
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
-- 点赞记录表
-- ----------------------------
CREATE TABLE `likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `target_type` enum('file','comment','post') NOT NULL COMMENT '点赞目标类型',
  `target_id` varchar(24) NOT NULL COMMENT '点赞目标ID（MongoDB ObjectId）',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like` (`user_id`,`target_type`,`target_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_target` (`target_type`,`target_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞记录表';

-- ----------------------------
-- 评论表（MySQL中存储引用，主要内容在MongoDB中）
-- ----------------------------
CREATE TABLE `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '评论者ID',
  `target_type` enum('file','comment','post') NOT NULL COMMENT '评论目标类型',
  `target_id` varchar(24) NOT NULL COMMENT '评论目标ID（MongoDB ObjectId）',
  `mongodb_id` varchar(24) NOT NULL COMMENT 'MongoDB中的评论ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_target` (`target_type`,`target_id`),
  KEY `idx_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ----------------------------
-- 通知表
-- ----------------------------
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '接收通知的用户ID',
  `type` enum('like','comment','follow','mention','message','system') NOT NULL COMMENT '通知类型',
  `title` varchar(100) NOT NULL COMMENT '通知标题',
  `content` varchar(500) NOT NULL COMMENT '通知内容',
  `from_user_id` int DEFAULT NULL COMMENT '发送通知的用户ID',
  `related_type` enum('file','comment','profile','message') DEFAULT NULL COMMENT '关联类型',
  `related_id` varchar(24) DEFAULT NULL COMMENT '关联ID（MongoDB ObjectId）',
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
-- 会话表（存储JWT黑名单等）
-- ----------------------------
CREATE TABLE `user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `token_hash` varchar(255) NOT NULL COMMENT '令牌哈希',
  `expires_at` timestamp NOT NULL COMMENT '过期时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_user` (`user_id`),
  KEY `idx_expires` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';

-- ----------------------------
-- 系统配置表
-- ----------------------------
CREATE TABLE `system_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL COMMENT '配置键',
  `value` text COMMENT '配置值',
  `description` varchar(255) DEFAULT NULL COMMENT '配置描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入默认配置
INSERT INTO `system_configs` (`key`, `value`, `description`) VALUES
('max_file_size', '10485760', '最大文件上传大小（字节）'),
('allowed_file_types', 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif,webp,svg,mp4,mpeg,mov,webm,mp3,wav,ogg,m4a', '允许上传的文件类型'),
('jwt_expire_days', '7', 'JWT令牌过期天数'),
('items_per_page', '20', '每页显示条目数');

SET FOREIGN_KEY_CHECKS = 1;
