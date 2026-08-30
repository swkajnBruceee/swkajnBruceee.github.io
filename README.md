# Bruce's Blog

这是一个基于 Hexo 7 和 AnZhiYu 主题的静态博客，发布到 GitHub Pages。

## 常用命令

```bash
npm install          # 安装依赖
npm run server       # 本地预览 http://localhost:4000
npm run clean        # 清理 public 和 Hexo 缓存
npm run build        # 清理缓存并生成 public/
npm run check:site   # 检查生成页面的内部链接和关键资源
```

## 项目结构

- `_config.yml`：Hexo 基础配置
- `_config.anzhiyu.yml`：AnZhiYu 主题配置覆盖
- `source/_posts/`：文章 Markdown 源文件
- `source/css/`、`source/js/`、`source/img/`：自定义样式、脚本和图片
- `themes/anzhiyu/`：当前使用的主题源码
- `scaffolds/`：新文章和页面模板
- `tools/waline/`：Waline 部署文档与辅助脚本，不存放真实环境变量
- `public/`：Hexo 生成目录，不提交到 Git

## 写作与发布

```bash
npx hexo new post "文章标题"
npm run build
git add .
git commit -m "更新博客"
git push origin main
```

推送到 `main` 后，GitHub Actions 会自动构建并部署到 GitHub Pages。首次使用请在仓库 Settings → Pages → Build and deployment → Source 中选择 `GitHub Actions`。

请勿提交 `.env`、Waline 数据库密钥、JWT_TOKEN 或其他服务凭据。
