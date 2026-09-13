# Bruce's Blog

基于 Hexo 7 和 AnZhiYu 主题的个人博客，通过 GitHub Actions 发布到 GitHub Pages。

## 本地开发

使用 Node.js 24（版本记录在 `.nvmrc`），首次运行：

```bash
npm ci
npm run server       # 写作预览，默认 http://localhost:4000
```

```bash
npm run build        # 清理并生成 public/，同时生成本地依赖和无损图片
npm run preview      # 预览已经构建的 public/
npm run check:site   # 检查页面结构、链接、锚点、CSS 资源、索引和 manifest
npm test             # 自检工具的回归测试
```

浏览器回归测试需要先构建页面，并安装 Chromium：

```bash
npx playwright install chromium
npm run test:browser
# 或一次运行所有检查
npm run validate
```

也可以通过 `BLOG_BROWSER_PATH` 指定已安装的 Chromium / Chrome 可执行文件，例如 Linux：

```bash
BLOG_BROWSER_PATH=/usr/bin/google-chrome npm run validate
```

测试覆盖桌面与手机页面、搜索及重试、键盘操作、主题持久化、PJAX、404、数学公式和评论故障提示。浏览器测试会屏蔽外部请求，检查外部服务不可用时的行为，不向真实评论服务提交数据。

## 项目结构

- `_config.yml`：Hexo 配置、RSS、搜索索引、站点地图
- `_config.anzhiyu.yml`：主题与评论服务配置
- `source/_posts/`：文章 Markdown
- `source/css/`、`source/js/`、`source/img/`：自定义样式、交互和原图
- `themes/anzhiyu/`：主题源码及本项目的模板修复
- `scaffolds/`：新文章、草稿和页面模板
- `scripts/vendor-assets.js`：从固定版本的 npm 包生成本地脚本、样式、字体和许可证信息
- `scripts/optimized-images.js`：生成无损 WebP，并设置图片尺寸和延迟加载
- `tools/site-check.js`、`tests/browser/`：构建检查与浏览器回归
- `tools/waline/`：评论服务部署文档和辅助脚本
- `public/`：生成目录；`.cache/images/`：图片转换缓存，均不提交

## 写作与发布

```bash
npx hexo new post "文章标题"
npx hexo new draft "草稿标题"
npx hexo publish "草稿标题"
```

文章请填写 `description`、`tags`、`categories` 和 `cover`；需要公式时设置 `mathjax: true`。修改文章内容后同步更新 `updated`。未填写更新日期的文章使用发布日期，不会在每次部署时被误标为刚更新。

文章原图仍保留在 `source/img/`。构建时仅在无损 WebP 至少小 10% 时替换页面图片引用，原图地址仍可使用。`npm run clean` 保留转换缓存；如需强制重新转换，可删除 `.cache/images/` 后再次构建。

首页推荐默认显示最新六篇文章，也可在文章 front-matter 设置 `top_group_index` 自定义推荐（数值越大越靠前）。首页分类入口使用主题配置中的 `home_top.category[].path`。赞赏者名单只有在 `reward.supporters_url` 填入实际页面地址后才显示。

完成写作后运行 `npm run validate`，再提交并推送。推送到 `main` 会自动检查并部署；PR 只执行检查。首次使用请在仓库 Settings → Pages → Build and deployment → Source 中选择 `GitHub Actions`。

搜索、页面导航、字体、图片灯箱和公式组件随站点发布。Waline 评论后端、音乐与外部链接仍依赖对应服务；评论服务失败时显示重试入口，评论计数使用 `—` 表示暂不可用。

请勿提交 `.env`、数据库密钥、JWT_TOKEN 或其他服务凭据。
