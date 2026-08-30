# CLAUDE.md

此文件为在该代码库中工作的 Claude Code (claude.ai/code) 提供指导。

## 项目概述

这是一个基于 Hexo 的静态博客项目，名为 "Bruce's Blog"，使用 AnZhiYu 主题。该博客部署在 GitHub Pages 上，专注于技术内容，包括 Web 开发、AI/ML 部署、Linux 系统管理和算法问题。

## 常用开发命令

### 开发工作流程
```bash
# 启动本地开发服务器
npm run server
# 或者
hexo server

# 生成静态文件
npm run build
# 或者
hexo generate

# 清理生成的文件和缓存
npm run clean
# 或者
hexo clean

# 提交后由 GitHub Actions 自动部署
git push origin main
```

### 创建新内容
```bash
# 创建新文章
hexo new "文章标题"

# 创建新草稿
hexo new draft "草稿标题"

# 发布草稿
hexo publish "草稿标题"
```

## 代码架构和结构

### 目录结构
- `source/` - 主内容目录
  - `_posts/` - 博客文章 Markdown 文件
  - `about/` - 关于页面
  - `categories/` - 分类页面
  - `tags/` - 标签页面
  - `css/` - 自定义 CSS 文件
  - `js/` - 自定义 JavaScript 文件
  - `img/` - 图片资源
- `themes/anzhiyu/` - 当前使用的 AnZhiYu 主题源码
- `source_dir`（在 _config.yml 中配置为 `source`）- 网站的源文件
- `public_dir`（在 _config.yml 中配置为 `public`）- 生成的静态文件

### 配置文件
1. `_config.yml` - 主 Hexo 配置
2. `_config.anzhiyu.yml` - AnZhiYu 主题特定配置
3. `themes/anzhiyu/_config.yml` - 主题默认配置
4. `package.json` - 项目依赖和脚本

### 内容组织
- 博客文章以 Markdown 格式写在 `source/_posts/` 中
- 文章使用 front-matter 作为元数据（标题、日期、标签、分类等）
- 自定义 CSS 和 JavaScript 文件分别在 `source/css/` 和 `source/js/` 中
- 图片按不同类型组织在 `source/img/` 的子目录中

### 主题结构
博客使用基于 Butterfly 主题的 AnZhiYu 主题：
- 布局模板在 `themes/anzhiyu/layout/` 中，使用 Pug 模板
- 样式在 `themes/anzhiyu/source/css/` 中，使用 Stylus
- JavaScript 文件在 `themes/anzhiyu/source/js/` 中
- 自定义标签和助手在 `themes/anzhiyu/scripts/` 中

### 部署
- 推送到 `main` 后由 `.github/workflows/pages.yml` 自动构建并部署到 GitHub Pages
- 仓库地址：https://github.com/swkajnBruceee/swkajnBruceee.github.io.git
- 分支：main
