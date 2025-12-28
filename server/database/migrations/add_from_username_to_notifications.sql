-- 添加 from_username 字段到 notifications 表
-- 根据数据库设计文档，notifications 表应该包含 from_username 字段

ALTER TABLE `notifications` 
ADD COLUMN `from_username` VARCHAR(50) NULL COMMENT '发送通知的用户名' AFTER `from_user_id`;

-- 更新数据库设计文档中提到的其他可能缺失的字段
-- 检查并可能需要添加的字段：
-- 1. 消息相关表中可能缺失的 message_id 字段
-- 2. 检查 users 表中的 passwordHash 字段（文档中提到但实际是 password）