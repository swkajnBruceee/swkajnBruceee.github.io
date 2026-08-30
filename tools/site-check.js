const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '..', 'public');
const requiredFiles = ['manifest.json', 'feed.xml', 'search.xml', 'sitemap.xml', 'robots.txt'];
const missing = new Set();
const htmlFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.html')) htmlFiles.push(file);
  }
}

function resolvePublicPath(url) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.split('#')[0].split('?')[0]);
  } catch {
    return null;
  }

  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) return null;
  const relative = pathname.slice(1);
  const candidates = [
    path.join(publicDir, relative),
    path.join(publicDir, `${relative}.html`),
    path.join(publicDir, relative, 'index.html')
  ];
  return candidates.find(file => fs.existsSync(file)) || null;
}

if (!fs.existsSync(publicDir)) {
  console.error('public/ 不存在，请先运行 npm run build');
  process.exit(1);
}

walk(publicDir);
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(publicDir, file))) missing.add(`/${file}`);
}

const attributePattern = /(?:href|src)=["']([^"']+)["']/gi;
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = attributePattern.exec(content))) {
    const url = match[1].trim();
    if (!resolvePublicPath(url)) {
      if (url.startsWith('/') && !url.startsWith('//')) missing.add(url);
    }
  }
}

const generatedText = htmlFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const forbidden = [
  'raw.githubusercontent.com/swkajnBruceee',
  'fork-archive',
  'mzlogin/mzlogin.github.io',
  'content="xxx"'
].filter(value => generatedText.includes(value));

console.log(`HTML 页面: ${htmlFiles.length}`);
console.log(`内部资源缺失: ${missing.size}`);
if (missing.size) {
  for (const url of [...missing].sort()) console.error(`  - ${url}`);
}
if (forbidden.length) console.error(`发现不应出现在页面中的内容: ${forbidden.join(', ')}`);

if (missing.size || forbidden.length) process.exit(1);
console.log('站点自检通过');
