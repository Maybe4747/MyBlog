# 前端路由配置说明

## 路由列表

### 认证页面（无需登录）
- **登录页面**: `/login`
  - 组件: `pages/login/index.jsx`
  - 描述: 用户登录页面，采用玻璃态设计风格

- **注册页面**: `/register`
  - 组件: `pages/register/index.jsx`
  - 描述: 用户注册页面，支持用户名/邮箱/密码注册

### 主要功能页面（需登录）
- **首页/仪表板**: `/home`
  - 组件: `pages/home/index.jsx`
  - 导航栏: ✅ 包含 Navbar
  - 描述: 用户个人仪表板，显示用户信息、统计数据和最近文件

- **个人资料页**: `/profile/:username`
  - 组件: `pages/profile/index.jsx`
  - 导航栏: ✅ 包含 Navbar
  - 描述: 显示用户个人资料、文件集合，支持文件分类过滤

- **文件上传页**: `/upload`
  - 组件: `pages/upload/index.jsx`
  - 导航栏: ✅ 包含 Navbar
  - 描述: 文件上传表单，支持多种文件格式

- **搜索页**: `/search`
  - 组件: `pages/search/index.jsx`
  - 导航栏: ✅ 包含 Navbar
  - 描述: 搜索用户和文件，支持标签页切换

- **通知页**: `/notifications`
  - 组件: `pages/notifications/index.jsx`
  - 导航栏: ✅ 包含 Navbar
  - 描述: 显示系统通知，支持筛选未读通知

### 重定向规则
- `/` → 重定向到 `/login`
- `/enter` → 重定向到 `/login`
- 其他未匹配路径 → 重定向到 `/login`

## 导航栏组件 (Navbar)

**位置**: `components/Navbar.jsx`

**功能特性**:
1. 固定在页面顶部，玻璃态背景
2. 品牌Logo和名称 (ProfileHub)
3. 全局搜索框，支持实时搜索建议
4. 通知图标，带未读数量徽章
5. 上传文件快捷按钮
6. 用户头像和下拉菜单（Profile、Settings、Logout）

**样式特点**:
- 深色半透明背景 (`backdrop-blur-xl`)
- 渐变按钮和图标
- 悬停动画效果
- 响应式设计

## 路由守卫

当前路由配置**不包含**认证守卫。在实际部署时，建议添加：

```javascript
// 示例：需要登录的路由保护
<Route
  path="/home"
  element={
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  }
/>
```

## 页面设计风格

所有页面遵循统一的设计系统：

### 视觉特征
- **背景**: 深紫色渐变 (`from-slate-900 via-purple-900 to-slate-900`)
- **玻璃态效果**: `backdrop-blur-xl` + 半透明白色
- **边框**: `border-white/10` 到 `border-white/20`
- **动画**: 浮动装饰球、模糊背景、缩放效果

### 文字和图标
- **标题**: 渐变色文字 (`from-cyan-400 via-purple-400 to-pink-400`)
- **正文**: 白色透明度 (`text-white/70`, `text-white/80`)
- **图标**: SVG格式，不同颜色代表不同类型

### 交互元素
- **按钮**: 渐变色 (`from-purple-600 to-pink-600`)
- **卡片**: 玻璃态背景，悬停时增强效果
- **输入框**: 半透明背景，聚焦时紫色边框

## 文件结构

```
client/src/
├── main.jsx                    # 路由配置入口
├── components/
│   ├── Navbar.jsx             # 全局导航栏
│   ├── FileCard.jsx           # 文件卡片组件
│   └── FileUpload.jsx         # 文件上传组件
├── pages/
│   ├── login/
│   │   └── index.jsx          # 登录页
│   ├── register/
│   │   └── index.jsx          # 注册页
│   ├── home/
│   │   └── index.jsx          # 首页/仪表板
│   ├── profile/
│   │   └── index.jsx          # 个人资料页
│   ├── upload/
│   │   └── index.jsx          # 文件上传页
│   ├── search/
│   │   └── index.jsx          # 搜索页
│   └── notifications/
│       └── index.jsx          # 通知页
```

## 开发注意事项

1. **所有主要功能页面都包含Navbar组件**
2. **Login/Register页面不包含Navbar**（独立认证流程）
3. **Navbar是固定定位**，所有页面内容需要考虑顶部空间
4. **搜索功能集成在Navbar中**，可直接从任何页面访问
5. **文件卡片使用Link包装**，整个卡片都可点击

## 后续扩展

建议未来添加的页面和路由：
- `/settings` - 用户设置页面
- `/file/:id` - 单个文件详情页
- `/following` - 关注列表页
- `/followers` - 粉丝列表页
- `/analytics` - 数据统计页
