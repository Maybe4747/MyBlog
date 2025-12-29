-- 添加火山引擎对象存储支持
-- 为user_files表添加file_url字段用于存储TOS URL
-- 为user_profiles表添加cover_image字段用于存储背景图片URL

-- 添加file_url字段到user_files表
ALTER TABLE `user_files` 
ADD COLUMN `file_url` varchar(500) DEFAULT NULL COMMENT '文件URL（TOS或本地存储）' AFTER `filename`;

-- 添加cover_image字段到user_profiles表
ALTER TABLE `user_profiles` 
ADD COLUMN `cover_image` varchar(500) DEFAULT NULL COMMENT '背景图片URL' AFTER `position`;

-- 如果已有数据，将filename迁移到file_url（本地存储的情况）
UPDATE `user_files` 
SET `file_url` = CONCAT('/uploads/', user_id, '/', filename) 
WHERE `file_url` IS NULL AND filename IS NOT NULL;

