-- 数据库备份脚本（在执行迁移前的备份）
-- 以下是当前数据库表结构的备份

-- 备份 users 表结构
CREATE TABLE `users_backup` LIKE `users`;
INSERT INTO `users_backup` SELECT * FROM `users`;

-- 备份 notifications 表结构
CREATE TABLE `notifications_backup` LIKE `notifications`;
INSERT INTO `notifications_backup` SELECT * FROM `notifications`;

-- 以及其他需要迁移的表...