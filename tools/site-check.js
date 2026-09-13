'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { parseDocument, DomUtils } = require('htmlparser2');
const yaml = require('js-yaml');
const elements = (dom, tag) => DomUtils.getElementsByTagName(tag, dom.children, true);

function checkSite({ publicDir, siteUrl, requiredFiles = ['index.html', '404.html', 'manifest.json', 'feed.xml', 'search.xml', 'sitemap.xml', 'robots.txt'] }) {
  const issues = new Set();
  const htmlFiles = [];
  const documents = new Map();
  const checkedStyles = new Set();
  const origin = new URL(siteUrl).origin;
  const fail = (file, message) => issues.add(`${file}: ${message}`);
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.html')) htmlFiles.push(path.relative(publicDir, file).split(path.sep).join('/'));
    }
  };
  const isFile = file => { try { return fs.statSync(file).isFile(); } catch { return false; } };
  const documentFor = file => {
    if (!documents.has(file)) documents.set(file, parseDocument(fs.readFileSync(path.join(publicDir, file), 'utf8')));
    return documents.get(file);
  };
  const resolve = (value, from) => {
    if (!value || /^(data:|mailto:|tel:|javascript:|blob:)/i.test(value)) return null;
    let url;
    try { url = new URL(value, new URL(from, origin + '/')); }
    catch { fail(from, `无效 URL ${value}`); return null; }
    if (url.origin !== origin) return null;
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { fail(from, `URL 编码无效 ${value}`); return null; }
    const relative = pathname.replace(/^\/+/, '');
    const candidates = [relative, path.posix.join(relative, 'index.html')];
    if (!path.posix.extname(relative) && !pathname.endsWith('/')) candidates.push(relative + '.html');
    const file = candidates.find(candidate => {
      const full = path.resolve(publicDir, candidate);
      return full.startsWith(path.resolve(publicDir) + path.sep) && isFile(full);
    });
    if (!file) { fail(from, `资源或页面不存在 ${value}`); return null; }
    return { file, hash: url.hash };
  };
  const checkCss = file => {
    if (checkedStyles.has(file)) return;
    checkedStyles.add(file);
    const css = fs.readFileSync(path.join(publicDir, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)|@import\s+['"]([^'"]+)['"]/gi)) {
      const value = (match[2] || match[3]).trim();
      if (value.startsWith('#')) continue;
      const resolved = resolve(value, file);
      if (resolved?.file.endsWith('.css')) checkCss(resolved.file);
    }
  };

  if (!fs.existsSync(publicDir)) return { pages: 0, styles: 0, issues: ['public/ 不存在，请先运行 npm run build'] };
  for (const file of requiredFiles) if (!isFile(path.join(publicDir, file))) fail(file, '缺少必要文件');
  walk(publicDir);
  if (!htmlFiles.length) fail('public/', '没有 HTML 页面');
  for (const file of htmlFiles) {
    const dom = documentFor(file);
    const all = elements(dom, '*');
    const content = fs.readFileSync(path.join(publicDir, file), 'utf8');
    if (!/^\s*<!doctype html>/i.test(content) || !elements(dom, 'html').length || !elements(dom, 'body').length) fail(file, '缺少完整 HTML 文档结构');
    if (!elements(dom, 'title').some(node => DomUtils.textContent(node).trim())) fail(file, '缺少页面标题');
    if (!elements(dom, 'main').length) fail(file, '缺少 main 正文区域');
    const metas = elements(dom, 'meta');
    if (!metas.some(node => node.attribs.name === 'description' && node.attribs.content?.trim())) fail(file, '缺少页面描述');
    const canonicals = elements(dom, 'link').filter(node => node.attribs.rel === 'canonical');
    if (canonicals.length !== 1) fail(file, 'canonical 应当有且只有一个');
    else if (resolve(canonicals[0].attribs.href, file)?.file !== file) fail(file, 'canonical 未指向当前页面');
    if (file === '404.html' && !metas.some(node => node.attribs.name === 'robots' && /noindex/.test(node.attribs.content))) fail(file, '404 页面缺少 noindex');
    for (const script of elements(dom, 'script').filter(node => node.attribs.type === 'application/ld+json')) {
      try { JSON.parse(DomUtils.textContent(script)); } catch { fail(file, '结构化数据不是有效 JSON'); }
    }
    for (const node of all) {
      for (const attribute of ['href', 'src', 'poster', 'data-src']) {
        const value = node.attribs[attribute];
        if (!value || value === '#') continue;
        const resolved = resolve(value, file);
        if (resolved?.file.endsWith('.css')) checkCss(resolved.file);
        if (resolved?.file.endsWith('.html') && resolved.hash && resolved.hash !== '#search' && attribute === 'href') {
          let id;
          try { id = decodeURIComponent(resolved.hash.slice(1)); } catch { fail(file, `锚点编码无效 ${value}`); continue; }
          if (!elements(documentFor(resolved.file), '*').some(target => target.attribs.id === id || target.attribs.name === id)) fail(file, `锚点不存在 ${value}`);
        }
      }
      if (node.attribs.srcset && !node.attribs.srcset.startsWith('data:')) {
        for (const entry of node.attribs.srcset.split(',')) resolve(entry.trim().split(/\s+/)[0], file);
      }
    }
    for (const forbidden of ['raw.githubusercontent.com/swkajnBruceee', 'fork-archive', 'mzlogin/mzlogin.github.io', 'content="xxx"']) {
      if (content.includes(forbidden)) fail(file, `发现遗留占位内容 ${forbidden}`);
    }
  }
  const manifestFile = path.join(publicDir, 'manifest.json');
  if (isFile(manifestFile)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      resolve(manifest.start_url, 'manifest.json');
      for (const icon of manifest.icons || []) resolve(icon.src, 'manifest.json');
      for (const shortcut of manifest.shortcuts || []) {
        resolve(shortcut.url, 'manifest.json');
        for (const icon of shortcut.icons || []) resolve(icon.src, 'manifest.json');
      }
    } catch { fail('manifest.json', '无法解析 manifest'); }
  }
  for (const [file, tag] of [['search.xml', 'url'], ['sitemap.xml', 'loc'], ['feed.xml', 'link']]) {
    if (!isFile(path.join(publicDir, file))) continue;
    const dom = parseDocument(fs.readFileSync(path.join(publicDir, file), 'utf8'), { xmlMode: true });
    const links = elements(dom, tag).map(node => DomUtils.textContent(node)).filter(Boolean);
    if (!links.length) fail(file, '索引没有链接');
    for (const link of links) {
      resolve(link, file);
      if (file === 'sitemap.xml' && /\/404\.html$/.test(link)) fail(file, '站点地图不应收录 404');
    }
  }
  return { pages: htmlFiles.length, styles: checkedStyles.size, issues: [...issues].sort() };
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const config = yaml.load(fs.readFileSync(path.join(root, '_config.yml'), 'utf8'));
  const result = checkSite({ publicDir: path.join(root, 'public'), siteUrl: config.url });
  console.log(`HTML 页面: ${result.pages}；关联样式: ${result.styles}；发现问题: ${result.issues.length}`);
  for (const issue of result.issues) console.error(`  - ${issue}`);
  if (result.issues.length) process.exitCode = 1;
  else console.log('站点自检通过');
}
module.exports = { checkSite };
