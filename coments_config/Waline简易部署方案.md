# Waline 最简部署方案（零维护）

## 🎯 为什么选择这个方案？

- ✅ **完全免费**：无需付费
- ✅ **零维护**：部署后无需管理
- ✅ **自动更新**：Vercel自动部署最新版本
- ✅ **高性能**：全球CDN加速
- ✅ **数据安全**：MongoDB Atlas专业数据库服务

## 📋 部署步骤（10分钟完成）

### 第一步：准备数据库（3分钟）

1. **注册MongoDB Atlas**
   - 访问：https://www.mongodb.com/cloud/atlas
   - 使用Google账号快速注册
   - 选择免费的M0套餐（512MB存储，足够个人博客使用）

2. **创建数据库**
   - 创建集群（选择离你最近的区域）
   - 创建数据库用户（记住用户名和密码）
   - 设置网络访问：添加IP地址 `0.0.0.0/0`（允许所有IP访问）
   - 获取连接字符串（类似：`mongodb+srv://username:password@cluster.xxx.mongodb.net/waline`）

### 第二步：一键部署到Vercel（2分钟）

1. **点击一键部署**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwalinejs%2Fwaline%2Ftree%2Fmain%2Fexample)

2. **配置环境变量**
   在部署页面添加以下环境变量：
   ```
   MONGO_DB=你的MongoDB连接字符串
   JWT_TOKEN=随机生成的32位字符串（用于安全认证）
   SITE_NAME=你的网站名称
   SITE_URL=你的网站地址
   ```

3. **完成部署**
   - 点击Deploy
   - 等待2-3分钟部署完成
   - 记录你的Vercel域名（如：`your-app.vercel.app`）

### 第三步：配置博客（3分钟）

1. **更新Butterfly配置**
   在 `_config.butterfly.yml` 中添加：
   ```yaml
   # 评论系统切换为Waline
   comments:
     use: Waline
     text: true
     lazyload: false
     count: true
     card_post_count: true

   # Waline配置
   waline:
     serverURL: https://your-app.vercel.app  # 替换为你的Vercel域名
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

2. **重新部署博客**
   ```bash
   hexo clean && hexo g && hexo d
   ```

### 第四步：设置管理员（2分钟）

1. **访问管理后台**
   - 地址：`https://your-app.vercel.app/ui`
   - 首次访问会要求注册管理员账号

2. **完成设置**
   - 设置管理员邮箱和密码
   - 现在你可以管理所有评论了！

## 🎨 可选：美化样式

如果你想让评论区更好看，可以在 `source/css/custom.css` 中添加：

```css
/* Waline评论区美化 */
.waline-container {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.waline-container:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

/* 编辑器样式 */
.wl-editor {
  border-radius: 8px !important;
  border: 1px solid var(--border-color) !important;
  background: var(--bg-color) !important;
}

/* 按钮样式 */
.wl-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 6px !important;
  color: white !important;
  transition: all 0.3s ease !important;
}

.wl-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
}

/* 评论卡片 */
.wl-card {
  border-radius: 8px !important;
  border: 1px solid var(--border-color) !important;
  margin-bottom: 1rem !important;
  transition: all 0.3s ease !important;
}

.wl-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
}

/* 表情包悬停效果 */
.wl-emoji:hover {
  transform: scale(1.2) !important;
  transition: transform 0.2s ease !important;
}
```

## 🔧 高级配置（可选）

### 邮件通知
如果想要评论邮件通知，在Vercel环境变量中添加：
```
SMTP_SERVICE=QQ
SMTP_USER=你的QQ邮箱
SMTP_PASS=你的QQ邮箱授权码
AUTHOR_EMAIL=你的邮箱
```

### 安全设置
```
SECURE_DOMAINS=你的域名.com,你的域名.github.io
DISABLE_USERAGENT=true
```

## 🎉 完成！

现在你的博客就有了一个功能强大、维护简单的评论系统！

## 💡 维护提示

- **数据备份**：MongoDB Atlas自动备份，无需担心
- **系统更新**：Vercel会自动部署最新版本
- **监控**：可以在Vercel和MongoDB控制台查看使用情况
- **成本**：完全免费，MongoDB Atlas 512MB + Vercel免费额度足够个人博客使用

## 🆚 与Giscus对比

| 特性 | Waline | Giscus |
|------|--------|--------|
| 匿名评论 | ✅ 支持 | ❌ 需要GitHub账号 |
| 管理后台 | ✅ 功能完整 | ❌ 依赖GitHub |
| 邮件通知 | ✅ 支持 | ❌ 不支持 |
| 表情包 | ✅ 丰富 | ✅ 支持 |
| 数据控制 | ✅ 完全控制 | ❌ 依赖GitHub |
| 部署难度 | 🟡 中等 | 🟢 简单 |

建议：可以同时保留两个系统，让用户选择使用哪个！