# 个人职业资料管理平台 - 后端API

## 项目简介

基于React和Express的个人职业资料管理平台后端服务，提供用户管理、文件管理、社交互动、搜索等功能的RESTful API。

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MySQL + MongoDB混合存储
- **缓存**: Redis
- **搜索引擎**: Elasticsearch
- **实时通信**: Socket.IO
- **认证**: JWT + bcrypt
- **文件上传**: Multer
- **验证**: express-validator

## 功能特性

### 🔐 用户认证系统
- 用户注册/登录
- JWT令牌认证
- bcrypt密码加密
- 令牌刷新机制

### 👤 个人资料管理
- 多种文件格式支持（PDF、DOCX、JPG、PNG、MP4等）
- 三级权限控制（公开、仅关注者可见、私密）
- 文件标签与描述
- 文件分类管理

### 🤝 社交互动
- 关注/取消关注用户
- 点赞/取消点赞
- 评论功能
- @提及功能
- WebSocket实时通信

### 🔍 搜索功能
- Elasticsearch全文检索
- Redis缓存优化
- 用户搜索
- 文件搜索
- 搜索建议

### 🔔 消息通知
- 实时通知推送
- 未读消息统计
- 通知标记已读
- 多种通知类型

## 项目结构

```
server/
├── config/             # 数据库配置
│   └── database.js
├── database/           # 数据库相关
│   ├── schema.sql
│   └── init.js
├── middleware/         # 中间件
│   └── auth.js
├── models/             # MongoDB数据模型
│   ├── User.js
│   ├── Profile.js
│   ├── Follow.js
│   └── Notification.js
├── routes/             # 路由模块
│   ├── auth.js         # 认证路由
│   ├── users.js        # 用户路由
│   ├── profiles.js     # 档案路由
│   ├── files.js        # 文件路由
│   ├── social.js       # 社交路由
│   ├── search.js       # 搜索路由
│   ├── notifications.js # 通知路由
│   └── index.js        # 路由入口
├── socket/             # WebSocket处理
│   └── handler.js
├── utils/              # 工具函数
│   ├── upload.js       # 文件上传工具
│   └── search.js       # 搜索工具
├── uploads/            # 文件上传目录
├── app.js              # Express应用配置
├── index.js            # 服务器入口
├── package.json
└── .env.example        # 环境变量示例
```

## 环境准备

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接信息：

```env
# 数据库配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=career_platform

MONGO_URI=mongodb://localhost:27017/career_platform

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# Elasticsearch配置
ELASTICSEARCH_NODE=http://localhost:9200

# JWT配置
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=7d
```

### 3. 安装数据库服务

确保以下服务已安装并正在运行：

- **MySQL** (推荐版本 8.0+)
- **MongoDB** (推荐版本 6.0+)
- **Redis** (推荐版本 7.0+)
- **Elasticsearch** (推荐版本 8.0+) - 可选

#### MySQL安装

Windows:
- 下载MySQL Installer: https://dev.mysql.com/downloads/installer/
- 安装并启动MySQL服务

macOS:
```bash
brew install mysql
brew services start mysql
```

#### MongoDB安装

Windows/macOS:
- 下载MongoDB Community Server: https://www.mongodb.com/try/download/community
- 安装并启动MongoDB服务

#### Redis安装

Windows:
- 下载Redis: https://github.com/microsoftarchive/redis/releases
- 或使用WSL

macOS:
```bash
brew install redis
brew services start redis
```

#### Elasticsearch安装

Docker (推荐):
```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.11.0
```

### 4. 初始化数据库

运行数据库初始化脚本：

```bash
node database/init.js
```

此脚本将创建数据库和所有必要的表结构。

## 启动服务

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

服务器将在 `http://localhost:3001` 启动

## API文档

### 统一响应格式

为保证前后端数据交互的一致性，所有API接口统一返回以下格式：

```json
{
  "code": 0,
  "data": {},
  "msg": "操作成功"
}
```

其中：
- `code`: 0 表示成功，非0表示错误
- `data`: 返回的数据内容
- `msg`: 提示信息

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/refresh` - 刷新访问令牌

### 用户接口

- `GET /api/users/:username` - 获取用户公开信息
- `PUT /api/users/profile` - 更新用户档案
- `POST /api/users/avatar` - 上传用户头像
- `GET /api/users/:username/files` - 获取用户的文件列表

### 档案接口

- `GET /api/profiles/my` - 获取当前用户的档案
- `POST /api/profiles/files` - 添加文件到档案
- `PUT /api/profiles/files/:fileId` - 更新文件信息
- `DELETE /api/profiles/files/:fileId` - 删除文件

### 社交接口

- `POST /api/social/follow` - 关注用户
- `DELETE /api/social/follow/:userId` - 取消关注
- `GET /api/social/followers/:userId` - 获取粉丝列表
- `GET /api/social/following/:userId` - 获取关注列表
- `POST /api/social/like` - 点赞
- `DELETE /api/social/like/:fileId` - 取消点赞
- `POST /api/social/comment` - 发表评论

### 搜索接口

- `GET /api/search/users` - 搜索用户
- `GET /api/search/files` - 搜索文件
- `GET /api/search/suggestions` - 获取搜索建议

### 通知接口

- `GET /api/notifications` - 获取通知列表
- `POST /api/notifications/mark-read` - 标记已读
- `GET /api/notifications/unread-count` - 获取未读数量
- `DELETE /api/notifications/:id` - 删除通知

## WebSocket事件

### 客户端发送事件

- `like` - 点赞事件
- `follow` - 关注事件
- `comment` - 评论事件
- `mention` - @提及事件
- `message` - 发送消息

### 服务器推送事件

- `notification` - 通知推送
- `message` - 消息接收

## 安全特性

- JWT身份认证
- 密码bcrypt加密
- 请求频率限制
- CORS跨域保护
- Helmet安全头
- 输入数据验证
- 文件类型过滤
- 文件大小限制

## 部署说明

### 1. 生产环境配置

确保设置以下环境变量：

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your_strong_secret_key
# 其他数据库连接信息...
```

### 2. PM2部署

```bash
npm install -g pm2
pm2 start index.js --name "career-platform-api"
```

### 3. Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 开发规范

### 错误处理

所有路由都应使用try-catch包装，错误响应格式：

```json
{
  "error": "错误描述",
  "details": "详细错误信息"
}
```

### 数据验证

使用express-validator进行输入验证：

```javascript
router.post('/route', [
  body('field').isLength({ min: 5 }).withMessage('字段长度不足')
], handler);
```

### 日志记录

使用morgan记录HTTP请求日志，错误日志使用console.error。

## 常见问题

### Q: 启动时提示数据库连接失败
A: 请确保MySQL、MongoDB和Redis服务正在运行，并且.env配置文件中的连接信息正确。

### Q: Elasticsearch连接失败
A: Elasticsearch是可选服务。如果未安装或未启动，搜索功能将自动降级到MongoDB查询。

### Q: 文件上传失败
A: 请检查uploads目录是否有写入权限，以及文件大小是否超过配置限制。

### Q: JWT令牌无效
A: 检查JWT_SECRET环境变量是否设置，并确保客户端正确发送Authorization头。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题，请联系开发团队。
