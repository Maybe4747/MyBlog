-- 创建访客统计表
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

