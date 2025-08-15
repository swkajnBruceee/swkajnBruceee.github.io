# Sticker-Heo 表情包配置说明

## 配置完成

✅ 已成功为你的 Waline 评论系统配置了 Sticker-Heo 表情包！

## 配置详情

### 更新的文件
1. `_config.anzhiyu.yml` - AnZhiYu 主题配置文件
2. `_config.butterfly.yml` - Butterfly 主题配置文件

### 添加的表情包
- **Sticker-Heo**: `https://cdn.jsdelivr.net/npm/sticker-heo@2022.7.5/Sticker-100/`
- 保留了原有的表情包：
  - 微博表情
  - Alus 表情
  - 哔哩哔哩表情
  - 贴吧表情

## 如何验证配置

1. 访问你的博客：http://localhost:4000/
2. 进入任意一篇文章页面
3. 滚动到评论区
4. 点击评论框中的表情按钮（😀）
5. 你应该能看到新增的 Sticker-Heo 表情包选项卡

## 表情包特点

- **Sticker-Heo** 是适合大多数网站与应用的通用基础表情
- 包含丰富的表情符号，提升用户评论体验
- 仅非商业博客免授权使用

## 表情包预览

你可以在这里预览所有可用的表情：
[表情预览网站](https://emotion.xiaokang.me/#/emotion/Heo-100)

## 注意事项

- 表情包已配置为第一个选项卡，会优先显示
- 如果表情包无法加载，请检查网络连接
- 配置使用的是 CDN 链接，确保稳定性

## 故障排除

如果表情包没有显示：
1. 清除浏览器缓存
2. 重新生成博客：`hexo clean && hexo generate`
3. 检查配置文件中的 emoji 配置是否正确
4. 确认 Waline 服务器正常运行

---

配置完成时间：" + new Date().toLocaleString('zh-CN') + "