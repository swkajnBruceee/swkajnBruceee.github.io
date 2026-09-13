# 开发说明

环境、命令和写作流程见 [README](../README.md)。

## 修改位置

一般站点设置修改 `_config.yml`，主题覆盖修改 `_config.anzhiyu.yml`。本项目直接维护 `themes/anzhiyu/` 内的 Pug 模板与脚本，升级上游主题时需要保留这里的本地修改。

自定义交互放在 `source/js/`，通过主题配置的 `inject.bottom` 加载。PJAX 会替换页面主体，常驻脚本应使用事件代理，或在 `pjax:complete` 初始化当前页面，并在 `pjax:send` 释放观察器和动画。搜索弹窗放在被替换区域之外，其状态在切页时保留。

页面 SEO 数据由 `head.pug`、`Open_Graph.pug` 和 `config_site.pug` 生成。JavaScript 配置通过 JSON 序列化写入；JSON-LD 在 PJAX 完成后同步，不能作为 pjax 0.2 的直接 script 选择器，否则会被当成 JavaScript 执行。

## 资源与构建

关键前端依赖由 `scripts/vendor-assets.js` 从 `node_modules` 生成到 `public/vendor/`，同时附带包内许可证和版本说明。升级依赖必须同时检查路径映射和 `package-lock.json`，不要直接修改生成目录。

`optimized-images.js` 保留原图，生成更小的无损 WebP，并设置原始尺寸以减少图片加载时的布局跳动。带旋转信息或多帧的图片不转换；转换缓存按文件内容和 Sharp 版本索引。

404 页面在 `source/404.md` 定义，使用 `layout: page` 和字符串 `type: '404'`；主题生成器只在没有自定义 404 时提供后备页面。不要设为不存在的 `layout: 404`。

## 验证与发布

运行 `npm run validate`：自检工具测试 → 完整构建 → 全站静态检查 → 浏览器测试。浏览器测试需要 Chromium，安装方式见 README。

静态检查会验证页面确实是 HTML、标题和描述、canonical、内部链接及锚点、CSS 中的字体/图片、srcset、视频封面、RSS、站点地图、搜索索引和 manifest。它不会探测外部服务的实时可用性。

浏览器测试使用本地构建页面并阻止外部请求。修改评论服务配置后，还需要在可访问该后端的环境手动检查读取、登录和发评流程；自动测试不提交真实评论。

`.github/workflows/pages.yml` 在 PR 和 main 分支推送时执行检查，仅 main 分支推送或手动运行会部署到 GitHub Pages。
