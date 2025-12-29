# 火山引擎对象存储（TOS）配置指南

本文档说明如何配置和使用火山引擎对象存储（TOS）来实现文件和图片上传功能。

## 1. 创建存储桶

1. 登录[火山引擎控制台](https://console.volcengine.com/)
2. 进入对象存储（TOS）服务
3. 创建一个新的存储桶（Bucket）
4. 记录存储桶名称和所在区域

## 2. 获取访问凭证

1. 在火山引擎控制台，进入"访问控制" > "密钥管理"
2. 创建访问密钥（AccessKey），获取：
   - AccessKey ID
   - AccessKey Secret
3. **重要**：为了安全，建议使用临时访问凭证（STS），避免在代码中直接暴露密钥

## 3. 配置环境变量

在 `server/.env` 文件中添加以下配置：

```env
# 火山引擎对象存储（TOS）配置
TOS_ACCESS_KEY_ID=your_access_key_id
TOS_ACCESS_KEY_SECRET=your_access_key_secret
TOS_REGION=cn-beijing
TOS_ENDPOINT=tos-cn-beijing.volces.com
TOS_BUCKET_NAME=your_bucket_name
```

### 配置说明

- `TOS_ACCESS_KEY_ID`: 你的AccessKey ID
- `TOS_ACCESS_KEY_SECRET`: 你的AccessKey Secret
- `TOS_REGION`: 存储桶所在区域，例如：`cn-beijing`、`cn-shanghai` 等
- `TOS_ENDPOINT`: 存储桶的endpoint地址，格式通常为：`tos-{region}.volces.com`
- `TOS_BUCKET_NAME`: 你创建的存储桶名称

### 区域和Endpoint对照表

| 区域 | Endpoint示例 |
|------|-------------|
| 北京 | tos-cn-beijing.volces.com |
| 上海 | tos-cn-shanghai.volces.com |
| 广州 | tos-cn-guangzhou.volces.com |

## 4. 运行数据库迁移

执行以下SQL脚本，为数据库添加必要的字段：

```bash
mysql -u your_username -p your_database < server/database/migrations/add_tos_support.sql
```

或者直接在MySQL客户端中执行 `server/database/migrations/add_tos_support.sql` 文件。

## 5. 存储桶权限配置

### 公开读取（推荐用于头像、背景图片等）

1. 在存储桶设置中，将存储桶设置为"公开读取"
2. 这样上传的文件可以直接通过URL访问

### 私有存储（推荐用于敏感文件）

1. 保持存储桶为私有
2. 需要时可以通过TOS SDK生成预签名URL（需要额外实现）

## 6. CORS配置（如果需要前端直传）

如果计划让前端直接上传到TOS，需要配置CORS：

1. 在存储桶设置中找到"CORS配置"
2. 添加允许的来源域名
3. 允许的方法：`PUT`、`POST`、`GET`、`HEAD`
4. 允许的头部：`*` 或具体指定

## 7. 使用方式

### 必需配置

**重要：系统现在只支持火山引擎对象存储（TOS），必须配置TOS环境变量才能使用文件上传功能。**

如果TOS配置不完整，上传功能将无法使用。

### API接口

#### 上传头像
```
POST /api/users/avatar
Content-Type: multipart/form-data
Body: avatar (file)
```

#### 上传背景图片
```
POST /api/users/cover
Content-Type: multipart/form-data
Body: cover (file)
```

#### 上传文件
```
POST /api/profiles/files
Content-Type: multipart/form-data
Body: 
  - files (file)
  - title (string)
  - description (string, optional)
  - visibility (string, optional)
  - tags (array, optional)
```

## 8. 文件存储结构

上传到TOS的文件按以下结构组织：

```
avatars/
  └── {userId}/
      └── {timestamp}-{random}.{ext}

covers/
  └── {userId}/
      └── {timestamp}-{random}.{ext}

files/
  └── {userId}/
      └── {timestamp}-{random}.{ext}
```

## 9. 数据库字段

### user_files 表
- `file_url`: 存储文件的完整URL（TOS URL或本地URL）

### user_profiles 表
- `cover_image`: 存储背景图片的URL

### users 表
- `avatar`: 存储头像的URL（已存在）

## 10. 注意事项

1. **安全性**：
   - 不要在代码仓库中提交包含真实密钥的 `.env` 文件
   - 生产环境建议使用STS临时凭证

2. **成本**：
   - 注意存储桶的存储费用和流量费用
   - 定期清理不需要的文件

3. **性能**：
   - TOS提供CDN加速，访问速度通常优于本地存储
   - 适合生产环境使用

4. **兼容性**：
   - 系统同时支持TOS和本地存储
   - 可以根据环境灵活切换

## 11. 故障排查

### 上传失败
- 检查环境变量配置是否正确
- 检查AccessKey是否有上传权限
- 检查存储桶名称和区域是否正确

### URL无法访问
- 检查存储桶是否设置为公开读取
- 检查文件路径是否正确
- 检查CORS配置（如果前端直接访问）

### 数据库错误
- 确保已运行数据库迁移脚本
- 检查字段类型和长度是否足够

## 12. 测试

配置完成后，可以通过以下方式测试：

1. 使用Postman或类似工具上传文件
2. 检查返回的URL是否可以正常访问
3. 检查数据库中是否正确存储了URL

