# Waline 评论系统部署指南

## 🎯 部署步骤

### 方法一：MongoDB + Railway 部署（推荐，免费稳定）

1. **准备 MongoDB 数据库**
   - 访问：https://www.mongodb.com/cloud/atlas
   - 使用 Google 账号快速注册
   - 选择免费的 M0 套餐（512MB 存储，足够个人博客使用）
   - 创建集群（选择离你最近的区域）
   - 创建数据库用户（记住用户名和密码）
   - 设置网络访问：添加 IP 地址 `0.0.0.0/0`（允许所有 IP 访问）
   - 获取连接字符串（类似：`mongodb+srv://username:password@cluster.xxx.mongodb.net/waline`）

2. **Railway 一键部署**
   - 访问：https://railway.app/
   - 使用 GitHub 账号登录
   - 点击一键部署：[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/kwKHmi)
   - 填写项目名称（如：waline-comment）
   - 配置环境变量：
     ```
     MONGO_DB=你的MongoDB连接字符串
     JWT_TOKEN=随机生成的32位字符串（用于安全认证）
     SITE_NAME=你的网站名称
     SITE_URL=你的网站地址
     ```
   - 点击 Deploy 开始部署
   - 等待 1-2 分钟部署完成
   - 在 Settings 中找到你的应用域名（如：waline-comment-production.up.railway.app）

3. **配置博客**
   在 `_config.butterfly.yml` 中更新 Waline 配置：
   ```yaml
   # Waline 配置
   waline:
     serverURL: https://你的Railway应用域名  # 替换为你的 Railway 域名
     lang: zh-CN
     visitor: true
     emoji:
       - https://unpkg.com/@waline/emojis@1.2.0/weibo
       - https://unpkg.com/@waline/emojis@1.2.0/alus
       - https://unpkg.com/@waline/emojis@1.2.0/bilibili
     meta: ['nick', 'mail', 'link']
     requiredMeta: ['nick']
     wordLimit: 0
     pageSize: 10
   ```

4. **设置管理员**
   - 访问：`https://你的Railway应用域名/ui`
   - 首次访问会要求注册管理员账号
   - 设置管理员邮箱和密码

### 方法二：Vercel 部署（备选方案）

1. **Fork Waline 项目**
   - 访问：https://github.com/walinejs/waline
   - 点击右上角 Fork 按钮

2. **Vercel 部署**
   - 访问：https://vercel.com/
   - 使用 GitHub 账号登录
   - 点击 "New Project"
   - 选择刚才 Fork 的 waline 项目
   - 点击 Deploy

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   ```
   MONGO_DB=你的MongoDB连接字符串
   JWT_TOKEN=随机生成的32位字符串
   SITE_NAME=你的网站名称
   SITE_URL=你的网站地址
   ```

## 🔧 配置你的博客

1. **更新配置文件**
   在 `_config.butterfly.yml` 中找到 Waline 配置，填入你的服务器地址：
   ```yaml
   waline:
     serverURL: https://你的应用域名  # Railway 或 Vercel 域名
   ```

2. **重新生成并部署博客**
   ```bash
   hexo clean
   hexo generate
   hexo deploy
   ```

## 🎨 自定义样式

如果你想自定义评论区样式，可以在 `source/css/waline-custom.css` 中添加：

```css
/* Waline 评论区自定义样式 */
.waline-container {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}

.waline-container .wl-editor {
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.waline-container .wl-btn {
  background: var(--btn-bg);
  color: var(--btn-color);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.waline-container .wl-btn:hover {
  background: var(--btn-hover-bg);
  transform: translateY(-1px);
}

/* 评论卡片样式 */
.waline-container .wl-card {
  border-radius: 8px;
  border: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

/* 表情包样式 */
.waline-container .wl-emoji {
  border-radius: 4px;
  transition: transform 0.2s ease;
}

.waline-container .wl-emoji:hover {
  transform: scale(1.2);
}
```

## 📊 管理后台

1. **访问管理后台**
   - 地址：`你的服务器地址/ui`
   - 首次访问会要求设置管理员账号

2. **管理功能**
   - 评论审核
   - 用户管理
   - 数据统计
   - 邮件通知设置

## 🔔 邮件通知配置

在 Railway 或 Vercel 环境变量中添加：
```
SMTP_SERVICE=QQ  # 或其他邮件服务
SMTP_USER=你的邮箱
SMTP_PASS=你的邮箱授权码
SITE_NAME=你的网站名称
SITE_URL=你的网站地址
AUTHOR_EMAIL=你的邮箱
```

## 🛡️ 安全设置

1. **域名白名单**
   ```
   SECURE_DOMAINS=你的域名.com,你的域名.github.io
   ```

2. **禁止注册**
   ```
   DISABLE_USERAGENT=true
   ```

## 🎉 完成！

配置完成后，你的博客文章页面底部就会显示 Waline 评论区了！

## 🔍 常见问题

**Q: 评论区不显示？**
A: 检查 serverURL 是否正确，确保服务器正常运行

**Q: 无法发送评论？**
A: 检查域名是否在白名单中，查看浏览器控制台错误信息

**Q: 邮件通知不工作？**
A: 确认 SMTP 配置正确，检查邮箱授权码是否有效

**Q: Railway 部署失败？**
A: 检查 MongoDB 连接字符串是否正确，确保包含数据库名称

**Q: Railway 应用休眠问题？**
A: Railway 免费版会在一段时间不活动后休眠，首次访问可能较慢，这是正常现象

需要帮助可以查看官方文档：https://waline.js.org/