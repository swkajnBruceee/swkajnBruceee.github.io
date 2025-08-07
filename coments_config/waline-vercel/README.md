# Waline Vercel 部署

这是 Waline 评论系统的 Vercel 部署配置。

## 快速部署

### 方法一：一键部署（推荐）

1. 点击下面的按钮一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/swkajnBruceee/swkajnBruceee.github.io/tree/main/coments_config/waline-vercel)

2. 配置环境变量（见下方说明）

### 方法二：手动部署

1. Fork 这个仓库
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

## 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

### 必需变量

- `JWT_TOKEN`: 32位随机字符串，用于加密
- `MONGO_DB`: MongoDB 连接字符串

### 可选变量

- `SITE_NAME`: 网站名称
- `SITE_URL`: 网站地址
- `ADMIN_EMAIL`: 管理员邮箱
- `SECURE_DOMAINS`: 允许的域名

## 数据库设置

### MongoDB Atlas（推荐）

1. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费集群
3. 创建数据库用户
4. 获取连接字符串
5. 将连接字符串设置为 `MONGO_DB` 环境变量

### LeanCloud（备选）

1. 注册 [LeanCloud](https://leancloud.cn/)
2. 创建应用
3. 获取 App ID、App Key、Master Key
4. 设置对应的环境变量

## 部署后设置

1. 部署完成后，访问 `https://your-domain.vercel.app/ui`
2. 注册管理员账号
3. 在博客配置中更新 `serverURL`

## 故障排除

### 登录页面无反应

1. 检查环境变量是否正确配置
2. 确认数据库连接正常
3. 查看 Vercel 函数日志

### 评论无法显示

1. 检查 `serverURL` 配置
2. 确认域名在 `SECURE_DOMAINS` 中
3. 检查浏览器控制台错误

## 本地开发

```bash
# 安装依赖
npm install

# 创建 .env 文件并配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev
```