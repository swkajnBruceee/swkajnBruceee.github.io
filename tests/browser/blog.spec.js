const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const { parseDocument, DomUtils } = require('htmlparser2');
const index = parseDocument(fs.readFileSync('public/search.xml', 'utf8'), { xmlMode: true });
const postUrls = DomUtils.getElementsByTagName('url', index.children, true).map(node => DomUtils.textContent(node));
const article = postUrls.find(url => url.includes('Hexo'));
const mathArticle = postUrls.find(url => url.includes('machine-learning'));
const pageErrors = new WeakMap();

// 第三方故障不应破坏本地导航、阅读与搜索；不向真实评论服务写入测试数据。
test.beforeEach(async ({ page }) => {
  pageErrors.set(page, []);
  page.on('pageerror', error => pageErrors.get(page).push(error.message));
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:4173/') ? route.continue() : route.abort());
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), '浏览器中不应出现未处理的 JavaScript 异常').toEqual([]);
});

test('首页分类可访问，推荐有内容，关键脚本不依赖 CDN', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.banners-title')).toContainText('生活明朗');
  await expect(page.locator('.topGroup .recent-post-item')).toHaveCount(6);
  await expect(page.locator('#loading-box')).toHaveClass('loaded');
  await page.locator('.categoryButton').first().click();
  await expect(page).toHaveURL(/\/categories\//);
  await expect(page.locator('.blog-search-trigger').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('搜索输出纯文本、标记关键词，并在 PJAX 切换时同步 metadata', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => { window.blogTestSentinel = true; });
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('Linux');
  const first = page.locator('.blog-search-item').first();
  await expect(first.locator('mark').first()).toBeVisible();
  await expect(first).not.toContainText('<h1');
  await first.click();
  await expect(page).toHaveURL(/2025\/08\/19/);
  await expect(page.locator('#blog-search-modal')).not.toBeVisible();
  expect(await page.evaluate(() => window.blogTestSentinel)).toBe(true);
  const metadata = await page.evaluate(() => ({
    canonical: new URL(document.querySelector('link[rel="canonical"]').href).pathname,
    actual: location.pathname,
    schema: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent),
    og: new URL(document.querySelector('meta[property="og:url"]').content).pathname
  }));
  expect(metadata.canonical).toBe(metadata.actual);
  expect(metadata.og).toBe(metadata.actual);
  expect(metadata.schema['@type']).toBe('Article');
  await page.locator('.blog-search-trigger').click();
  await expect(page.getByRole('searchbox')).toBeFocused();
  expect(errors).toEqual([]);
});

test('搜索加载失败后可重试，慢网络和特殊字符查询可正常处理', async ({ page }) => {
  let requests = 0;
  await page.route('**/search.xml', async route => {
    requests += 1;
    if (requests === 1) return route.fulfill({ status: 503, body: 'unavailable' });
    await route.continue();
  });
  await page.goto('/#search');
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible();
  await page.getByRole('button', { name: '重新加载' }).click();
  await page.getByRole('searchbox').fill('Linux');
  await expect(page.locator('.blog-search-item').first()).toBeVisible();
  await page.getByRole('searchbox').fill('<img src=x onerror=alert(1)> [.*');
  await expect(page.getByRole('status')).toContainText('未找到');
  expect(await page.locator('#blog-search-modal img').count()).toBe(0);
  expect(requests).toBe(2);
});

test('搜索支持键盘焦点约束、Esc 返回和方向键打开文章', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('.blog-search-trigger');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.activeElement.closest('dialog')?.id)).toBe('blog-search-modal');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('searchbox').fill('Hexo');
  await expect(page.locator('.blog-search-item').first()).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.blog-search-item').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/20\d\d\//);
});

test('系统深色偏好和用户选择在切页、刷新后保持一致', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.evaluate(() => window.toggleDarkMode());
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('.categoryButton').first().click();
  await expect(page).toHaveURL(/categories/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('本地存储损坏或禁用时仍能浏览与切换主题', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('theme', '{broken');
    Storage.prototype.setItem = () => { throw new Error('Storage disabled'); };
  });
  await page.goto('/');
  await page.evaluate(() => window.toggleDarkMode());
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('移动端页面和搜索弹窗没有横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of ['/', article, '/about/', '/404.html']) {
    await page.goto(url);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.locator('.blog-search-trigger').first().click();
    await expect(page.getByRole('searchbox')).toBeVisible();
    expect(await page.evaluate(() => document.querySelector('dialog').getBoundingClientRect().right <= innerWidth)).toBe(true);
  }
});

test('404 页面包含搜索与正文，无 JavaScript 时首页仍可阅读', async ({ page, browser }) => {
  await page.goto('/404.html');
  await expect(page.locator('h1')).toContainText('404');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  await page.getByRole('link', { name: '搜索文章', exact: true }).click();
  await expect(page.getByRole('searchbox')).toBeVisible();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plainPage = await context.newPage();
  await plainPage.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:4173/') ? route.continue() : route.abort());
  await plainPage.goto('http://127.0.0.1:4173/');
  await expect(plainPage.locator('#loading-box')).not.toBeVisible();
  await plainPage.locator('.categoryButton').first().click();
  await expect(plainPage).toHaveURL(/categories/);
  await context.close();
});

test('评论服务离线时显示可重试提示，切页后恢复搜索', async ({ page }) => {
  await page.goto(article);
  await page.locator('#waline-wrap').scrollIntoViewIfNeeded();
  await expect(page.locator('#waline-wrap')).toContainText('评论暂时无法加载');
  await expect(page.locator('#waline-wrap button')).toHaveText('点击重试');
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('数学文章直接访问与 PJAX 再次进入均可渲染公式', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(mathArticle);
  await expect(page.locator('mjx-container').first()).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => window.pjax.loadUrl('/'));
  await expect(page).toHaveURL('/');
  await page.evaluate(url => window.pjax.loadUrl(url), mathArticle);
  await expect(page.locator('mjx-container').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('图片在窄屏保持原始比例，404 封面填满卡片', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(mathArticle);
  const photo = page.locator('#article-container img[src$=".webp"]').first();
  await photo.scrollIntoViewIfNeeded();
  await expect.poll(() => photo.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  const ratioError = await photo.evaluate(img => {
    const rect = img.getBoundingClientRect();
    return Math.abs(rect.width / rect.height - img.naturalWidth / img.naturalHeight);
  });
  expect(ratioError).toBeLessThan(0.015);
  await page.goto('/404.html');
  const difference = await page.locator('.thumbnail img').first().evaluate(img => {
    return Math.abs(img.getBoundingClientRect().height - img.parentElement.getBoundingClientRect().height);
  });
  expect(difference).toBeLessThan(1);
});
