# Waline 工具与文档

博客本身使用 AnZhiYu + Waline，主题地址配置在根目录的 `_config.anzhiyu.yml`。

## Waline 服务

服务端示例位于 `tools/waline/waline-vercel/`。真实环境变量只允许通过 Vercel/Railway 控制台或本地未提交的 `.env` 配置：

- `JWT_TOKEN`
- `MONGO_DB` 或 `LEAN_ID`、`LEAN_KEY`、`LEAN_MASTER_KEY`
- `SITE_URL`、`SECURE_DOMAINS`

仓库中只保留 `.env.example`，不要提交 `.env`、`.env.local` 或数据库连接字符串。

## 更新博客配置

```bash
node tools/waline/update-blog-config.js
```

该脚本会更新根目录 `_config.anzhiyu.yml` 中的 Waline `serverURL`。

评论系统切换脚本：

```bash
node tools/waline/switch-comments.js waline
node tools/waline/switch-comments.js giscus
```

修改配置后执行：

```bash
npm run build
git push origin main
```
