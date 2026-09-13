// 原图保留在 source/；仅在无损 WebP 明显更小时替换页面中的图片地址。
'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const { parseDocument, DomUtils } = require('htmlparser2');
const images = new Map();
let routes = [];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : /\.(png|jpe?g)$/i.test(entry.name) ? [file] : [];
  }));
  return nested.flat();
}

hexo.extend.filter.register('before_generate', async () => {
  images.clear();
  routes = [];
  const imageDir = path.join(hexo.source_dir, 'img');
  const cacheDir = path.join(hexo.base_dir, '.cache', 'images');
  await fs.mkdir(cacheDir, { recursive: true });
  const files = await walk(imageDir);
  let saved = 0;
  let originals = 0;
  async function optimize(file) {
    const input = await fs.readFile(file);
    const metadata = await sharp(input).metadata();
    const url = '/' + path.relative(hexo.source_dir, file).split(path.sep).join('/');
    const image = { width: metadata.width, height: metadata.height, url };
    images.set(url, image);
    // 避免更改带 EXIF 旋转信息或多帧图片的显示语义。
    if (input.length < 16384 || metadata.orientation > 1 || metadata.pages > 1) return;
    const hash = crypto.createHash('sha256').update(input).update(`lossless-webp:${sharp.versions.sharp}`).digest('hex');
    const cacheFile = path.join(cacheDir, `${hash}.webp`);
    let output;
    try { output = await fs.readFile(cacheFile); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      output = await sharp(input).webp({ lossless: true, effort: 4 }).toBuffer();
      await fs.writeFile(cacheFile, output);
    }
    if (output.length > input.length * 0.9) return;
    image.url = url + '.webp';
    routes.push({ path: image.url.slice(1), data: output });
    originals += input.length;
    saved += input.length - output.length;
  }
  // 限制并发，避免构建时同时解码所有大图。
  for (let i = 0; i < files.length; i += 4) await Promise.all(files.slice(i, i + 4).map(optimize));
  if (routes.length) hexo.log.info(`图片优化：${routes.length} 张，无损版本合计减少 ${(saved / 1048576).toFixed(1)} MiB（${Math.round(saved / originals * 100)}%）`);
}, 25);

hexo.extend.generator.register('optimized-images', () => routes);
hexo.extend.filter.register('after_render:html', html => {
  let imageIndex = 0;
  return html.replace(/<img\b[^>]*>/gi, tag => {
    const node = parseDocument(tag).children[0];
    if (!node?.attribs) return tag;
    const attrs = node.attribs;
    let key;
    try { key = decodeURIComponent((attrs.src || '').split(/[?#]/)[0]); } catch { return tag; }
    const optimized = images.get(key);
    if (optimized) {
      if (!attrs.srcset && optimized.url !== key) attrs.src = encodeURI(optimized.url);
      if (!attrs.width && !attrs.height) {
        attrs.width = String(optimized.width);
        attrs.height = String(optimized.height);
      }
    }
    attrs.decoding ||= 'async';
    attrs.loading ||= imageIndex++ < 3 ? 'eager' : 'lazy';
    return DomUtils.getOuterHTML(node, { encodeEntities: 'utf8' });
  });
});
