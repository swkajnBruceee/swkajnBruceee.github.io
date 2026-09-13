'use strict';
const { test, expect } = require('@playwright/test');
const pageErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  pageErrors.set(page, []);
  page.on('pageerror', error => pageErrors.get(page).push(error.message));
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:4173/') ? route.continue() : route.abort());
});
test.afterEach(async ({ page }) => { expect(pageErrors.get(page)).toEqual([]); });
const ready = page => expect(page.locator('.lab')).toHaveAttribute('data-umr-ready', 'true');
const pixels = page => page.locator('#scene').evaluate(canvas => canvas.toDataURL());

test('减少动态偏好下默认暂停，单步实际更新，关闭所有损失则保持原位', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/labs/umr/'); await ready(page);
  await expect(page.locator('.lab')).toHaveAttribute('data-running', 'false');
  await expect(page.locator('#status')).toContainText('减少动态效果');
  const before = await pixels(page);
  await page.getByRole('button', { name: '单步', exact: true }).click();
  await expect(page.locator('.lab')).toHaveAttribute('data-iteration', '1');
  expect(await pixels(page)).not.toBe(before);
  for (const id of ['chamfer', 'repulsion', 'smooth']) await page.locator('#' + id).uncheck();
  const stopped = await pixels(page);
  await page.getByRole('button', { name: '单步', exact: true }).click();
  expect(await pixels(page)).toBe(stopped);
  await expect(page.locator('#loss-repulsion')).toContainText('未参与更新');
  await page.locator('#repulsion').check();
  await page.getByRole('button', { name: '单步', exact: true }).click();
  expect(await pixels(page)).not.toBe(stopped);
});

test('播放暂停、重置、尺度、视角与扰动都可操作，手机和深色模式不溢出', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/labs/umr/'); await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: '播放', exact: true }).click();
  await expect.poll(() => page.locator('.lab').getAttribute('data-iteration')).not.toBe('0');
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const tick = await page.locator('.lab').getAttribute('data-iteration');
  await page.waitForTimeout(180);
  await expect(page.locator('.lab')).toHaveAttribute('data-iteration', tick);
  await page.locator('#radius').focus();
  await page.locator('#radius').press('End');
  await expect(page.locator('#radius-value')).toHaveText('0.120');
  await page.locator('#yaw').focus();
  await page.locator('#yaw').press('Home');
  await expect(page.locator('#yaw-value')).toHaveText('-55°');
  const before = await pixels(page);
  await page.getByRole('button', { name: '扰动对应点' }).click();
  expect(await pixels(page)).not.toBe(before);
  await page.getByRole('button', { name: '恢复三项与默认尺度' }).click();
  await expect(page.locator('#radius-value')).toHaveText('0.060');
  await expect(page.locator('.lab')).toHaveAttribute('data-iteration', '0');
  await page.locator('summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('动画离开视口后停止计算，返回后继续', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/labs/umr/'); await ready(page);
  await expect.poll(async () => Number(await page.locator('.lab').getAttribute('data-iteration'))).toBeGreaterThan(2);
  // Move the actual canvases offscreen without destroying them, as in an embedded article.
  await page.evaluate(() => { document.querySelector('.lab').style.marginTop = '3000px'; });
  await page.waitForTimeout(150);
  const hidden = await page.locator('.lab').getAttribute('data-iteration');
  await page.waitForTimeout(200);
  await expect(page.locator('.lab')).toHaveAttribute('data-iteration', hidden);
  await page.evaluate(() => { document.querySelector('.lab').style.marginTop = ''; });
  await expect.poll(async () => Number(await page.locator('.lab').getAttribute('data-iteration'))).toBeGreaterThan(Number(hidden));
});

test('真实网格可切换手部特写、隐藏表面与邻接显示', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/labs/umr/'); await ready(page);
  await expect(page.locator('.lab')).toHaveAttribute('data-robot-links', '37');
  await expect(page.locator('#render-note')).not.toBeEmpty();
  const whole = await pixels(page);
  await page.selectOption('#region', 'hand');
  const hand = await pixels(page);
  expect(hand).not.toBe(whole);
  await page.locator('#surface').uncheck();
  expect(await pixels(page)).not.toBe(hand);
  await page.selectOption('#region', 'upper');
  const noGraph = await pixels(page);
  await page.locator('#graph').check();
  expect(await pixels(page)).not.toBe(noGraph);
  await page.locator('summary').click();
  await expect(page.locator('.method')).toContainText('37 个可视链接');
  await expect(page.locator('.method')).toContainText('MakeHuman');
});

test('缺少 WebGL2 时显示真实网格线框并保持单步优化', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl2' ? null : getContext.call(this, type, ...args);
    };
  });
  await page.goto('/labs/umr/'); await ready(page);
  await expect(page.locator('.lab')).toHaveAttribute('data-renderer', 'wireframe');
  await expect(page.locator('#render-note')).toContainText('线框');
  const before = await pixels(page);
  await page.locator('#step').click();
  expect(await pixels(page)).not.toBe(before);
});

test('模型资源加载失败时解释原因，避免显示可操作的空动画', async ({ page }) => {
  await page.route('**/labs/umr/assets/surfaces.bin', route => route.fulfill({ status: 503, body: '' }));
  await page.goto('/labs/umr/');
  await expect(page.locator('#fallback')).toContainText('模型资源加载失败');
  await expect(page.locator('#play')).toBeDisabled();
  await expect(page.locator('#step')).toBeDisabled();
  await expect(page.locator('#region')).toBeDisabled();
});

test('正常构建可从首页进入 UMR，正文与目录入口能定位并操作内嵌动画', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const articleLink = page.getByRole('link', { name: 'UMR 精读：人体表面如何成为机器人的动作接口', exact: true }).first();
  await expect(articleLink).toBeVisible();
  await articleLink.click();
  await expect(page.locator('h1.post-title')).toContainText('UMR 精读');
  await expect(page.locator('.post-meta-position')).toHaveText('北京');
  const jump = page.locator('#article-container a[href="#umr-surface-demo"]');
  await expect(jump).toHaveText('人体表面到远征 A3 的交互动画');
  await expect(page.locator('.toc-link[href="#umr-surface-demo"]')).toContainText('交互动画');
  await jump.click();
  await expect(page.locator('#umr-surface-demo')).toBeInViewport();
  const embed = page.locator('iframe#umr-animation');
  await expect(embed).toHaveCount(1);
  await embed.scrollIntoViewIfNeeded();
  const frame = page.frameLocator('iframe#umr-animation');
  await expect(frame.locator('.lab')).toHaveAttribute('data-umr-ready', 'true');
  await expect(frame.locator('.lab')).toHaveAttribute('data-robot-links', '37');
  await frame.locator('#step').click();
  await expect(frame.locator('.lab')).toHaveAttribute('data-iteration', '1');
  await expect.poll(() => page.locator('#article-container mjx-container').count()).toBe(87);
  await expect(page.locator('mjx-merror')).toHaveCount(0);
  // A narrow viewport must keep the actual iframe and its controls readable.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => embed.evaluate(e => e.contentDocument.documentElement.scrollWidth <= e.clientWidth)).toBe(true);
});
