// 从 lockfile 固定的 npm 包生成本地资源，构建过程无需请求 CDN。
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const files = {
  pjax: ['pjax', 'pjax.min.js'],
  fancybox: ['@fancyapps/ui', 'dist/fancybox/fancybox.umd.js'],
  fancybox_css: ['@fancyapps/ui', 'dist/fancybox/fancybox.css'],
  snackbar: ['node-snackbar', 'dist/snackbar.min.js'],
  snackbar_css: ['node-snackbar', 'dist/snackbar.min.css'],
  qrcode: ['qrcodejs', 'qrcode.min.js'],
  waline_js: ['@waline/client', 'dist/waline.js'],
  waline_css: ['@waline/client', 'dist/waline.css'],
  waline_meta_css: ['@waline/client', 'dist/waline-meta.css'],
  fontawesome: ['@fortawesome/fontawesome-free', 'css/all.min.css'],
  mathjax: ['mathjax', 'es5/tex-mml-chtml.js'],
  ali_iconfont_css: ['anzhiyu-theme-static', 'icon/ali_iconfont_css.css'],
  waterfall: ['anzhiyu-theme-static', 'waterfall/waterfall.js'],
  accesskey_js: ['anzhiyu-theme-static', 'accesskey/accesskey.js'],
  aplayer_css: ['anzhiyu-theme-static', 'aplayer/APlayer.min.css'],
  aplayer_js: ['anzhiyu-blog-static', 'js/APlayer.min.js'],
  dark: ['anzhiyu-theme-static', 'dark/dark.js']
};
const routeFor = ([name, file]) => `vendor/${name}/${file}`;
hexo.extend.filter.register('before_generate', () => {
  for (const [key, file] of Object.entries(files)) hexo.theme.config.asset[key] = '/' + routeFor(file);
}, 20);
hexo.extend.generator.register('vendor-assets', () => {
  const assets = [...Object.values(files),
    ['three', 'build/three.module.min.js'],
    ['three', 'build/three.core.min.js'],
    ['anzhiyu-theme-static', 'icon/font_2508400_fpn9ui60u6q.woff2'],
    ['anzhiyu-theme-static', 'icon/font_2508400_fpn9ui60u6q.woff']
  ];
  function collect(name, directory, predicate) {
    for (const entry of fs.readdirSync(path.join(hexo.base_dir, 'node_modules', name, directory), { withFileTypes: true })) {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) collect(name, file, predicate);
      else if (predicate(file)) assets.push([name, file]);
    }
  }
  collect('@fortawesome/fontawesome-free', 'webfonts', file => /\.(woff2|ttf)$/.test(file));
  collect('mathjax', 'es5', file => /\.(js|woff)$/.test(file) && file !== files.mathjax[1]);
  const routes = assets.map(asset => {
    let data = fs.readFileSync(path.join(hexo.base_dir, 'node_modules', ...asset));
    if (asset[1] === 'icon/ali_iconfont_css.css') {
      data = data.toString().replace(/@font-face\s*\{[\s\S]*?\}/, '@font-face { font-family: "anzhiyufont"; font-display: swap; src: url("./font_2508400_fpn9ui60u6q.woff2") format("woff2"), url("./font_2508400_fpn9ui60u6q.woff") format("woff"); }');
    }
    return { path: routeFor(asset), data };
  });
  const packages = [...new Set(assets.map(([name]) => name))];
  const notices = [];
  for (const name of packages) {
    const directory = path.join(hexo.base_dir, 'node_modules', name);
    const info = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
    notices.push(`${name}@${info.version} — ${info.license || 'See package license'}`);
    for (const file of fs.readdirSync(directory).filter(file => /^(licen[sc]e|copying|notice)(\.|$)/i.test(file))) {
      routes.push({ path: `vendor/${name}/${file}`, data: fs.readFileSync(path.join(directory, file)) });
    }
  }
  routes.push({ path: 'vendor/NOTICE.txt', data: notices.join('\n') + '\n' });
  return routes;
});
