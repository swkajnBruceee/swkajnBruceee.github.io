# Railway 部署 Waline 详细指南

## 为什么选择 Railway 部署 Waline？

- ✅ **更稳定**：相比 Vercel，Railway 提供更稳定的服务和更少的冷启动时间
- ✅ **更高性能**：Railway 提供更好的计算资源和网络连接
- ✅ **免费额度**：每月提供 $5 的免费额度，足够个人博客使用
- ✅ **简单部署**：一键部署，无需复杂配置
- ✅ **MongoDB 支持**：原生支持 MongoDB 数据库，无需额外配置
- ✅ **更好的国内访问**：相比 Vercel，Railway 在国内访问更加稳定

## 快速开始（使用自动化脚本）

我们提供了多个自动化脚本，帮助你快速部署和管理 Waline 评论系统：

1. **使用批处理文件（最简单）**
   - 双击运行 `deploy-waline.bat`
   - 选择需要的操作（部署、检查状态、测试连接等）

2. **使用部署脚本**
   - 运行 `node deploy-waline-railway.js`
   - 按照提示完成配置

3. **一键部署**
   - 运行 `node one-click-deploy.js`
   - 自动打开浏览器并生成所需配置

## 准备工作

### 1. 注册 MongoDB Atlas

1. **访问 MongoDB Atlas**
   - 网址：https://www.mongodb.com/cloud/atlas/register
   - 使用 Google 账号快速注册

2. **创建免费集群**
   - 选择 "Shared" 免费方案
   - 选择云服务商（AWS 推荐）和区域（选择离你最近的）
   - 集群名称可默认

3. **创建数据库用户**
   - 在左侧菜单选择 "Database Access"
   - 点击 "Add New Database User"
   - 认证方式选择 "Password"
   - 输入用户名和密码（请记住这些信息）
   - 权限选择 "Read and write to any database"
   - 点击 "Add User"

4. **设置网络访问**
   - 在左侧菜单选择 "Network Access"
   - 点击 "Add IP Address"
   - 选择 "Allow Access from Anywhere" (输入 0.0.0.0/0)
   - 点击 "Confirm"

5. **获取连接字符串**
   - 回到 "Database" 页面
   - 点击 "Connect"
   - 选择 "Connect your application"
   - 驱动选择 "Node.js"
   - 版本选择最新版
   - 复制连接字符串，它看起来像：
     ```
     mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - 将 `<password>` 替换为你的实际密码
   - 在 `mongodb.net/` 后添加数据库名称，例如：
     ```
     mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/waline?retryWrites=true&w=majority
     ```

### 2. 注册 Railway 账号

1. **访问 Railway**
   - 网址：https://railway.app/
   - 使用 GitHub 账号登录（推荐）

2. **验证账号**
   - 首次使用需要验证邮箱
   - 可能需要绑定信用卡（不会立即扣费，仅用于验证）

## 部署步骤

### 1. 一键部署 Waline

1. **点击下方按钮开始部署**
   
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/kwKHmi)

2. **配置项目**
   - 输入项目名称（例如：waline-comment）
   - 选择 GitHub 仓库（可使用默认）
   - 点击 "Deploy"

3. **配置环境变量**
   在部署页面，添加以下环境变量：

   | 变量名 | 值 | 说明 |
   |-------|-----|------|
   | `MONGO_DB` | 你的MongoDB连接字符串 | 从MongoDB Atlas获取 |
   | `JWT_TOKEN` | 随机32位字符串 | 用于安全认证，可使用随机生成器 |
   | `SITE_NAME` | 你的网站名称 | 例如：我的博客 |
   | `SITE_URL` | 你的网站地址 | 例如：https://yourblog.com |

   可选环境变量（邮件通知）：

   | 变量名 | 值 | 说明 |
   |-------|-----|------|
   | `SMTP_SERVICE` | 邮件服务 | 例如：QQ、Gmail、Outlook |
   | `SMTP_USER` | 你的邮箱 | 用于发送通知邮件 |
   | `SMTP_PASS` | 邮箱授权码 | 不是邮箱密码，是授权码 |
   | `AUTHOR_EMAIL` | 你的邮箱 | 用于接收评论通知 |

4. **等待部署完成**
   - 部署过程大约需要 1-2 分钟
   - 部署完成后，Railway 会自动分配一个域名

5. **获取应用域名**
   - 在 Railway 项目页面，点击 "Settings" 标签
   - 找到 "Domains" 部分
   - 复制自动生成的域名（格式如：https://waline-comments.up.railway.app）

## 配置博客

### 更新 Hexo 配置

1. **编辑 `_config.butterfly.yml` 文件**
   - 找到 Waline 配置部分
   - 更新 serverURL 为 Railway 生成的域名

   ```yaml
   waline:
     serverURL: https://你的Railway域名  # 替换为你的域名
     lang: zh-CN
     visitor: true
     # 其他配置...
   ```

2. **重新生成博客**
   ```bash
   hexo clean && hexo g && hexo d
   ```

### 设置管理员账号

1. **访问管理员界面**
   - 打开 `https://你的Railway域名/ui`
   - 注册一个账号（这将是你的管理员账号）

2. **设置为管理员**
   方法一：在 MongoDB 中设置
   - 在 MongoDB Atlas 中找到你的数据库
   - 找到 `users` 集合
   - 将你注册的用户 `type` 字段改为 `1`

   方法二：使用环境变量
   - 在 Railway 项目中添加环境变量 `ADMIN_EMAIL`
   - 值设为你注册时使用的邮箱

## 使用辅助工具

我们提供了多个辅助工具，帮助你管理和维护 Waline 评论系统：

### 测试 MongoDB 连接

使用 `test-mongo.js` 脚本测试 MongoDB 连接是否正常：

```bash
node test-mongo.js "你的MongoDB连接字符串"
```

或者直接运行，按提示输入：

```bash
node test-mongo.js
```

### 检查 Waline 服务状态

使用 `check-waline-status.js` 脚本检查 Waline 服务是否正常运行：

```bash
node check-waline-status.js "https://你的Railway域名"
```

或者直接运行，按提示输入：

```bash
node check-waline-status.js
```

### 测试 Waline 服务

使用 `test-waline.js` 脚本快速测试 Waline 服务的各个关键接口：

```bash
node test-waline.js "https://你的Railway域名"
```

或者直接运行，按提示输入：

```bash
node test-waline.js
```

脚本会测试以下功能：
- 基础连接
- UI界面访问
- 评论API
- 计数API

并提供诊断信息和解决方案建议。

### 切换评论系统

如果你想在 Waline 和 Giscus 之间切换，可以使用 `switch-comments.js` 脚本：

```bash
node switch-comments.js waline  # 切换到 Waline
node switch-comments.js giscus  # 切换到 Giscus
```

或者直接运行，按提示选择：

```bash
node switch-comments.js
```

### 部署助手

使用 `deploy-waline.bat` 批处理文件可以快速访问所有工具：

1. 双击运行 `deploy-waline.bat`
2. 从菜单中选择需要的操作：
   - Railway 部署
   - 一键部署
   - 检查 Waline 状态
   - 测试 MongoDB 连接
   - 切换评论系统
   - 启动保活脚本
   - 测试 Waline 服务

### 工具集使用指南

详细的工具使用说明请参考 [Waline工具集使用指南.md](./Waline工具集使用指南.md)，其中包含了所有工具的功能介绍和使用方法。

## 常见问题与解决方案

### 1. Railway 应用休眠问题

Railway 免费计划有 500 小时/月的运行时间限制，可能导致应用休眠。

**解决方案：**

1. **使用保活脚本（推荐）**
   - 我们提供了专用的保活脚本，可以定期访问你的 Waline 服务，防止休眠
   - 双击运行 `keep-waline-alive.bat` 或使用命令 `node keep-waline-alive.js`
   - 脚本会自动从配置文件读取 serverURL 或让你手动输入
   - 可以设置访问间隔时间（默认10分钟）
   - 保持脚本在后台运行，可以有效防止应用休眠
   - 也可以通过部署助手选择"启动保活脚本"选项

2. **使用监控服务**
   - 可以使用免费的监控服务如 UptimeRobot 设置定时 ping
   - 设置每 5-10 分钟访问一次你的 Waline 服务

3. **升级到付费计划**
   - 升级到 Railway 付费计划（每月约 $5-10）
   - 付费计划没有休眠限制

### 2. 评论无法显示

**可能原因：**
- serverURL 配置错误
- Railway 服务未正常运行
- MongoDB 连接问题

**解决方案：**
- 使用 `check-waline-status.js` 检查服务状态
- 检查浏览器控制台是否有错误信息
- 确认 `_config.butterfly.yml` 中的 serverURL 配置正确

### 3. 数据库连接失败

**可能原因：**
- MongoDB 连接字符串格式错误
- 用户名或密码错误
- IP 访问限制

**解决方案：**
- 使用 `test-mongo.js` 测试连接
- 确认 MongoDB Atlas 中已设置 IP 访问限制为 0.0.0.0/0
- 检查用户名和密码是否正确

## 高级配置

### 自定义域名

如果你想使用自己的域名，可以在 Railway 中设置：

1. 在 Railway 项目中，点击 "Settings" > "Domains"
2. 点击 "Generate Domain" 或 "Add Custom Domain"
3. 按照提示配置 DNS 记录

### 安全设置

在 Railway 环境变量中添加以下配置增强安全性：

- `SECURE_DOMAINS`: 限制评论域名，如 `example.com,example.org`
- `DISABLE_REGION`: 设为 `true` 禁用 IP 地理位置显示
- `FORBID_EMAIL_REGISTRATION`: 设为 `true` 禁止邮箱注册

### 邮件通知美化

你可以自定义邮件通知模板，在 Railway 环境变量中添加：

- `MAIL_SUBJECT`: 自定义邮件主题
- `MAIL_TEMPLATE`: 自定义邮件模板 HTML
- `MAIL_SUBJECT_ADMIN`: 管理员收到的邮件主题

## 维护与监控

### 资源监控

Railway 提供了资源使用监控功能：

1. 在项目仪表板查看 CPU、内存使用情况
2. 监控每月用量，避免超出免费额度

### 数据备份

定期备份 MongoDB 数据是个好习惯：

1. 在 MongoDB Atlas 中，点击 "Backup"
2. 设置定期备份计划
3. 或手动导出数据库
   - 复制生成的域名（例如：waline-comment-production.up.railway.app）

### 2. 配置博客

1. **更新 Butterfly 主题配置**
   打开 `_config.butterfly.yml` 文件，更新以下内容：

   ```yaml
   # 评论系统配置
   comments:
     use: Waline  # 使用 Waline 评论系统
     text: true
     lazyload: false
     count: true
     card_post_count: true

   # Waline 配置
   waline:
     serverURL: https://你的Railway域名  # 替换为你的 Railway 应用域名
     lang: zh-CN
     visitor: true  # 文章访问量统计
     emoji:
       - https://unpkg.com/@waline/emojis@1.2.0/weibo
       - https://unpkg.com/@waline/emojis@1.2.0/alus
       - https://unpkg.com/@waline/emojis@1.2.0/bilibili
     meta: ['nick', 'mail', 'link']  # 评论者信息字段
     requiredMeta: ['nick']  # 必填字段
     wordLimit: 0  # 评论字数限制，0为不限制
     pageSize: 10  # 评论列表分页，每页条数
     avatar: 'monsterid'  # 头像类型
   ```

2. **重新生成并部署博客**
   ```bash
   hexo clean && hexo g && hexo d
   ```

### 3. 设置管理员账号

1. **访问管理后台**
   - 地址：`https://你的Railway域名/ui`
   - 首次访问会要求注册管理员账号

2. **注册管理员**
   - 填写昵称、邮箱和密码
   - 点击注册
   - 首个注册的用户将自动成为管理员

## 高级配置

### 自定义域名（可选）

1. **在 Railway 中添加自定义域名**
   - 在项目 "Settings" 中找到 "Domains"
   - 点击 "Generate Domain" 或 "Add Custom Domain"
   - 输入你的域名（例如：comment.yourblog.com）
   - 按照指引配置 DNS 记录

2. **更新博客配置**
   - 将 `_config.butterfly.yml` 中的 `serverURL` 更新为你的自定义域名

### 安全设置

在 Railway 项目的环境变量中添加：

```
SECURE_DOMAINS=你的域名.com,你的域名.github.io
DISABLE_USERAGENT=true
```

### 邮件通知美化

在 Railway 项目的环境变量中添加：

```
MAIL_SUBJECT=您在 [{{site.name}}] 的评论收到了回复
MAIL_TEMPLATE=<div style="border-top:2px solid #12ADDB;box-shadow:0 1px 3px #AAAAAA;line-height:180%;padding:0 15px 12px;margin:50px auto;font-size:12px;">
  <h2 style="border-bottom:1px solid #DDD;font-size:14px;font-weight:normal;padding:13px 0 10px 8px;">您在 <a style="text-decoration:none;color: #12ADDB;" href="{{site.url}}" target="_blank">{{site.name}}</a> 上的评论有了新回复</h2>
  <div style="padding:0 12px 0 12px;margin-top:18px">
    <p>Hi, <em>{{parent.nick}}</em></p>
    <p>您曾发表评论：</p>
    <div style="background-color: #f5f5f5;padding: 10px 15px;margin:18px 0;word-wrap:break-word;">
      {{parent.comment}}
    </div>
    <p><strong>{{self.nick}}</strong>回复说：</p>
    <div style="background-color: #f5f5f5;padding: 10px 15px;margin:18px 0;word-wrap:break-word;">
      {{self.comment}}
    </div>
    <p>您可以点击<a style="text-decoration:none; color:#12addb" href="{{page.url}}" target="_blank">查看完整的回复内容</a>，欢迎再次光临 <a style="text-decoration:none; color:#12addb" href="{{site.url}}" target="_blank">{{site.name}}</a>。</p>
    <br>
  </div>
</div>
```

## 维护与监控

### 查看日志

1. **访问 Railway 项目**
2. **点击 "Deployments"**
3. **选择当前部署**
4. **点击 "Logs" 查看运行日志**

### 资源使用监控

1. **访问 Railway 项目**
2. **点击 "Metrics"**
3. **查看 CPU、内存、网络等资源使用情况**

### 数据备份

MongoDB Atlas 提供自动备份功能：

1. **访问 MongoDB Atlas**
2. **选择你的集群**
3. **点击 "Backup"**
4. **配置备份策略**

## 常见问题

### Q: Railway 部署失败？

**A:** 检查以下几点：
- MongoDB 连接字符串是否正确
- 是否包含数据库名称（例如：.../waline?retryWrites=true...）
- JWT_TOKEN 是否设置
- 检查 Railway 部署日志中的错误信息

### Q: 评论功能无法使用？

**A:** 可能的原因：
- serverURL 配置错误
- Railway 应用未正常运行
- 域名白名单未正确设置
- 浏览器控制台有错误信息

### Q: Railway 应用休眠问题？

**A:** Railway 免费版在一段时间不活动后会休眠应用，首次访问可能较慢，这是正常现象。如需避免休眠，可以：
- 升级到付费版
- 使用定时任务定期访问应用保持活跃

### Q: 免费额度用完怎么办？

**A:** Railway 提供每月 $5 的免费额度，通常足够个人博客使用。如果用完：
- 可以升级到付费版
- 或迁移到其他平台（如 Vercel）

## 结语

恭喜你成功部署了 Waline 评论系统！现在你的博客拥有了一个功能完善、稳定可靠的评论系统。如果遇到任何问题，可以参考 [Waline 官方文档](https://waline.js.org/) 或在 [GitHub Issues](https://github.com/walinejs/waline/issues) 中寻求帮助。