-- 数据库表结构调整以完全符合设计文档
-- 根据数据库设计文档，调整字段名称和结构

-- 1. 重命名 users 表中的 password 字段为 passwordHash，符合设计文档
ALTER TABLE `users` CHANGE `password` `passwordHash` VARCHAR(255) NOT NULL COMMENT '密码哈希';

-- 2. 重命名时间戳字段以符合设计文档
ALTER TABLE `users` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
ALTER TABLE `users` CHANGE `updated_at` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';
ALTER TABLE `users` CHANGE `last_login` `lastLoginAt` TIMESTAMP NULL DEFAULT NULL COMMENT '最后登录时间';

-- 3. 检查 notifications 表，根据设计文档，应该有 from_username 字段
-- 从设计文档看，notifications 表应该包含 from_username 字段，但实际表结构中没有
-- 添加 from_username 字段
ALTER TABLE `notifications` ADD COLUMN `from_username` VARCHAR(50) NULL COMMENT '发送通知的用户名' AFTER `from_user_id`;

-- 4. 修正其他表的时间戳字段以符合设计文档
ALTER TABLE `user_profiles` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
ALTER TABLE `user_profiles` CHANGE `updated_at` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

ALTER TABLE `user_skills` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE `user_experiences` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE `user_education` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE `follows` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE `file_likes` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE `messages` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
ALTER TABLE `messages` CHANGE `updated_at` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

ALTER TABLE `notifications` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE `user_sessions` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE `user_social_links` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
ALTER TABLE `user_social_links` CHANGE `updated_at` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

ALTER TABLE `user_privacy_settings` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
ALTER TABLE `user_privacy_settings` CHANGE `updated_at` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

ALTER TABLE `user_files` CHANGE `uploaded_at` `uploadedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间';
ALTER TABLE `user_files` CHANGE `updated_at` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

ALTER TABLE `message_likes` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE `file_tags` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';

ALTER TABLE `file_comments` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
ALTER TABLE `file_comments` CHANGE `updated_at` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

ALTER TABLE `system_configs` CHANGE `created_at` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';
ALTER TABLE `system_configs` CHANGE `updated_at` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';