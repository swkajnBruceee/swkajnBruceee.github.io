# Bruce's Blog

基于 Hexo 和 Butterfly 主题的个人博客。

## 自动部署设置

本项目已配置 GitHub Actions 自动部署，每次推送到 `main` 分支时会自动构建和部署到 GitHub Pages。

### 部署流程

1. **推送代码**: 将更改推送到 GitHub 仓库的 `main` 分支
2. **自动构建**: GitHub Actions 会自动安装依赖并构建静态文件
3. **自动部署**: 构建完成后自动部署到 `gh-pages` 分支
4. **访问网站**: 通过 https://swkajnbruceee.github.io 访问你的博客

### 本地开发

```bash
# 安装依赖
npm install

# 启动本地服务器
npm run server

# 清理缓存
npm run clean

# 生成静态文件
npm run build
```

### 发布新文章

1. 创建新文章：`hexo new "文章标题"`
2. 编辑文章内容
3. 提交并推送到 GitHub
4. 等待自动部署完成

### 注意事项

- 确保 GitHub 仓库的 Pages 设置中源分支设置为 `gh-pages`
- 首次设置后可能需要几分钟才能看到网站更新
- 如果部署失败，检查 GitHub Actions 的日志信息