const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkSite } = require('./site-check');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-check-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const write = (name, content) => {
    const file = path.join(directory, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  const html = (url, body) => `<!doctype html><html><head><title>测试</title><meta name="description" content="描述"><link rel="canonical" href="https://blog.test${url}"></head><body><main>${body}</main></body></html>`;
  const check = () => checkSite({ publicDir: directory, siteUrl: 'https://blog.test', requiredFiles: [] });
  return { directory, write, html, check };
}

test('拒绝把样式文本当成 HTML 页面', t => {
  const f = fixture(t);
  f.write('404.html', '#error-wrap { display: flex; }');
  assert.ok(f.check().issues.some(issue => issue.includes('缺少完整 HTML')));
});
test('检查相对链接、站内绝对链接和锚点，同时允许外站链接', t => {
  const f = fixture(t);
  f.write('index.html', f.html('/', '<a href="./posts/文章/#章节">文章</a><a href="https://elsewhere.test/not-local">外链</a>'));
  f.write('posts/文章/index.html', f.html('/posts/文章/', '<h2 id="章节">正文</h2><a href="../../">首页</a>'));
  assert.deepEqual(f.check().issues, []);
  f.write('index.html', f.html('/', '<a href="https://blog.test/posts/文章/#失效">文章</a>'));
  assert.ok(f.check().issues.some(issue => issue.includes('锚点不存在')));
});
test('目录存在但没有 index.html 也应判定为失效链接', t => {
  const f = fixture(t);
  f.write('index.html', f.html('/', '<a href="empty/">空目录</a>'));
  fs.mkdirSync(path.join(f.directory, 'empty'));
  assert.ok(f.check().issues.some(issue => issue.includes('资源或页面不存在 empty/')));
});
test('检查 CSS 字体、图片候选地址、视频封面和 manifest 图标', t => {
  const f = fixture(t);
  f.write('index.html', f.html('/', '<link rel="stylesheet" href="/css/site.css"><img srcset="/small.webp 1x, /large.webp 2x"><video poster="/poster.webp"></video>'));
  f.write('css/site.css', '@font-face {src:url("../fonts/missing.woff2")}');
  f.write('manifest.json', JSON.stringify({ start_url: '/', icons: [{ src: '/icon.png' }] }));
  const issues = f.check().issues.join('\n');
  for (const file of ['missing.woff2', 'small.webp', 'large.webp', 'poster.webp', 'icon.png']) assert.ok(issues.includes(file), file);
});
