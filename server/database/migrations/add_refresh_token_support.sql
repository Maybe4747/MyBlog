-- 添加刷新令牌功能的数据库迁移脚本

-- 在 user_sessions 表中添加 refreshToken 字段
ALTER TABLE `user_sessions` ADD COLUMN `refresh_token` VARCHAR(255) COMMENT '刷新令牌哈希';
ALTER TABLE `user_sessions` ADD COLUMN `refresh_token_expires` TIMESTAMP COMMENT '刷新令牌过期时间';

-- 创建索引以优化查询
CREATE INDEX idx_refresh_token ON user_sessions(refresh_token);