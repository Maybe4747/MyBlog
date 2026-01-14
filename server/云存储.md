# 火山引擎对象存储（TOS）集成总结

## 已完成的工作

### 1. 安装依赖
- ✅ 已安装 `@volcengine/tos-sdk` 包

### 2. 创建TOS服务模块
- ✅ 创建 `server/utils/tos.js`，包含以下功能：
  - TOS客户端初始化
  - 文件上传到TOS（`uploadToTOS`）
  - 头像上传（`uploadAvatar`）
  - 背景图片上传（`uploadCover`）
  - 普通文件上传（`uploadFile`）
  - 文件删除（`deleteFromTOS`）
  - 配置检查（`checkTOSConfig`）

### 3. 更新上传工具
- ✅ 更新 `server/utils/upload.js`：
  - 添加TOS支持检测
  - 根据配置自动选择内存存储（TOS）或磁盘存储（本地）
  - 新增 `processFileUpload` 函数，统一处理文件上传逻辑

### 4. 更新API路由
- ✅ 更新 `server/routes/profiles.js`：
  - 文件上传接口现在支持TOS上传
  - 上传后返回文件URL并存储到数据库

- ✅ 更新 `server/routes/users.js`：
  - 新增头像上传接口 `POST /api/users/avatar`
  - 新增背景图片上传接口 `POST /api/users/cover`
  - 两个接口都支持TOS上传

### 5. 更新服务层
- ✅ 更新 `server/services/fileService.js`：
  - `createFile` 函数现在支持存储 `file_url` 字段

### 6. 数据库迁移
- ✅ 创建迁移脚本 `server/database/migrations/add_tos_support.sql`：
  - 为 `user_files` 表添加 `file_url` 字段
  - 为 `user_profiles` 表添加 `cover_image` 字段
  - 包含数据迁移逻辑（将现有filename迁移到file_url）

### 7. 文档
- ✅ 创建配置指南 `server/TOS_SETUP.md`
- ✅ 创建实现总结 `server/TOS_IMPLEMENTATION_SUMMARY.md`（本文件）

## 使用方式

### 配置环境变量

在 `server/.env` 文件中添加：

```env
TOS_ACCESS_KEY_ID=your_access_key_id
TOS_ACCESS_KEY_SECRET=your_access_key_secret
TOS_REGION=cn-beijing
TOS_ENDPOINT=tos-cn-beijing.volces.com
TOS_BUCKET_NAME=your_bucket_name
```

### 运行数据库迁移

```bash
mysql -u username -p database_name < server/database/migrations/add_tos_support.sql
```

### API使用示例

#### 上传头像
```bash
curl -X POST http://localhost:3000/api/users/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

#### 上传背景图片
```bash
curl -X POST http://localhost:3000/api/users/cover \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "cover=@/path/to/cover.jpg"
```

#### 上传文件
```bash
curl -X POST http://localhost:3000/api/profiles/files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/file.pdf" \
  -F "title=我的文件" \
  -F "description=文件描述"
```

## 存储方式

**注意：系统现在只支持火山引擎对象存储（TOS），不再支持本地存储。**

必须配置TOS环境变量才能使用文件上传功能。

## 文件存储结构

### TOS存储结构
```
avatars/{userId}/{timestamp}-{random}.{ext}
covers/{userId}/{timestamp}-{random}.{ext}
files/{userId}/{timestamp}-{random}.{ext}
```

## 数据库字段

### user_files 表
- `filename`: 原始文件名（用于显示）
- `file_url`: 文件完整URL（TOS URL或本地URL）

### user_profiles 表
- `cover_image`: 背景图片URL

### users 表
- `avatar`: 头像URL（已存在）

## 注意事项

1. **安全性**：
   - 不要将包含真实密钥的 `.env` 文件提交到代码仓库
   - 生产环境建议使用STS临时凭证

2. **存储桶权限**：
   - 头像和背景图片建议设置为"公开读取"
   - 敏感文件建议使用私有存储+预签名URL

3. **URL格式**：
   - TOS URL格式：`https://{bucket}.{endpoint}/{filePath}`

4. **必需配置**：
   - 必须配置TOS环境变量才能使用文件上传功能
   - 如果TOS配置不完整，上传功能将无法使用

## 下一步

1. 在火山引擎控制台创建存储桶
2. 获取AccessKey和Secret
3. 配置环境变量
4. 运行数据库迁移
5. 测试上传功能

详细配置步骤请参考 `server/TOS_SETUP.md`。

