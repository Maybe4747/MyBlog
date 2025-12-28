-- 添加 passwordHash 字段到 users 表
-- 将现有的 password 字段值复制到新的 passwordHash 字段
ALTER TABLE `users` ADD COLUMN `passwordHash` VARCHAR(255) COMMENT '密码哈希';

-- 将现有的 password 字段值复制到 passwordHash 字段
UPDATE `users` SET `passwordHash` = `password`;

-- 可选：删除旧的 password 字段（谨慎操作，建议先备份）
-- ALTER TABLE `users` DROP COLUMN `password`;