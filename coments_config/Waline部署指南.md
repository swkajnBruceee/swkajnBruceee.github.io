# Waline评论系统部署指南

## 简介

本指南提供了多种部署Waline评论系统的方法，以及相关的管理和维护工具。由于Vercel部署方式可能存在问题，我们推荐使用Railway进行部署，它提供更稳定的服务和更好的性能。

## 部署方式对比

| 部署方式 | 优点 | 缺点 |
| --- | --- | --- |
| **Railway** | 稳定性好，性能优，免费额度足够个人博客使用 | 需要信用卡验证 |
| **Vercel** | 配置简单，集成GitHub | 国内访问不稳定，容易超出免费额度 |
| **自建服务器** | 完全控制，无限制 | 需要自己维护，成本较高 |

## Railway部署方法（推荐）

### 准备工作

1. 注册[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)账号并创建免费数据库
2. 注册[Railway](https://railway.app/)账号（需要GitHub账号和信用卡验证）

### 自动部署

我们提供了自动部署脚本，只需运行以下命令：

```bash
node deploy-waline-railway.js
```

脚本会引导你完成以下步骤：
1. 生成JWT Token
2. 配置MongoDB连接
3. 部署到Railway
4. 更新博客配置
5. 设置管理员账号

### 手动部署

1. 创建MongoDB数据库并获取连接字符串
2. 点击[一键部署按钮](https://railway.app/template/oWH0Md)
3. 配置以下环境变量：
   - `MONGO_DB`: MongoDB连接字符串
   - `JWT_TOKEN`: 随机字符串，用于加密
   - `SITE_NAME`: 你的网站名称
   - `SITE_URL`: 你的网站URL
4. 部署完成后，获取Railway生成的域名
5. 更新`_config.butterfly.yml`中的`serverURL`

## 管理和维护

### 管理员设置

1. 访问`https://你的域名/ui`
2. 注册一个账号
3. 将该账号设为管理员（在MongoDB中将用户的`type`字段改为`1`，或使用环境变量`ADMIN_EMAIL`设置）

### 实用工具

我们提供了以下实用工具帮助你管理Waline：

- **测试MongoDB连接**：`node test-mongo.js`
- **检查Waline状态**：`node check-waline-status.js`
- **切换评论系统**：`node switch-comments.js [waline|giscus]`

### 常见问题

1. **Railway应用休眠问题**
   - Railway免费计划有500小时/月的限制
   - 使用我们提供的保活脚本防止休眠：
     ```bash
     node keep-waline-alive.js
     ```
   - 或双击运行 `keep-waline-alive.bat`
   - 脚本会定期访问Waline服务，保持应用活跃

2. **评论无法显示**
   - 检查serverURL配置是否正确
   - 使用`check-waline-status.js`检查服务状态
   - 查看浏览器控制台是否有错误

3. **数据库连接失败**
   - 确认MongoDB连接字符串格式正确
   - 检查IP访问限制（应设为0.0.0.0/0允许所有IP）
   - 使用`test-mongo.js`测试连接

## 高级配置

### 安全设置

在Railway环境变量中添加以下配置：

- `SECURE_DOMAINS`: 限制评论域名，如`example.com,example.org`
- `DISABLE_REGION`: 设为`true`禁用IP地理位置显示
- `FORBID_EMAIL_REGISTRATION`: 设为`true`禁止邮箱注册

### 邮件通知

配置以下环境变量启用邮件通知：

```
SMTP_SERVICE=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SENDER_NAME=
SENDER_EMAIL=
```

## 资源监控

Railway提供了资源使用监控功能，可以在项目仪表板查看：

- CPU使用率
- 内存使用情况
- 存储使用情况
- 网络流量

## 相关链接

- [Waline官方文档](https://waline.js.org/)
- [Railway文档](https://docs.railway.app/)
- [MongoDB Atlas文档](https://docs.atlas.mongodb.com/)