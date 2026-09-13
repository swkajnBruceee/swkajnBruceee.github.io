const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:4173/') ? route.continue() : route.abort());
});

for (const viewport of [{ width: 1366, height: 768 }, { width: 1000, height: 900 }, { width: 390, height: 844 }]) {
  test(`${viewport.width}×${viewport.height} 中控台保留评论、标签和归档，可关闭后重新进入`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto('/');
    const opener = page.getByRole('button', { name: '打开中控台', exact: true });
    await opener.click();
    await expect(page.locator('#console')).toHaveClass('show');
    await expect(page.getByRole('button', { name: '关闭中控台', exact: true })).toBeInViewport();
    await expect(page.locator('#card-newest-comments')).toBeVisible();
    const tag = page.locator('#console .card-tag-cloud a').first();
    const archive = page.locator('#console .card-archive-list-link').first();
    await tag.scrollIntoViewIfNeeded();
    await expect(tag).toBeInViewport();
    await archive.scrollIntoViewIfNeeded();
    await expect(archive).toBeInViewport();
    expect(await page.locator('#console .console-card-group').evaluate(group => group.scrollWidth <= group.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.getByRole('button', { name: '关闭中控台', exact: true }).click();
    await expect(page.locator('#console')).not.toBeVisible();
    await expect(opener).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#console')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#console')).not.toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('中控台主题仅切换一次，遮罩关闭与 PJAX 后再次打开可用', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: '打开中控台', exact: true }).click();
  await page.locator('#console .darkmode_switchbutton').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const closeColors = await page.locator('#center-console + label').evaluate(label => ({
    background: getComputedStyle(label, '::after').backgroundColor,
    icon: getComputedStyle(label.querySelector('i')).backgroundColor
  }));
  expect(closeColors.icon).not.toBe(closeColors.background);
  await page.locator('#console .console-mask').click({ position: { x: 10, y: 100 } });
  await expect(page.locator('#console')).not.toBeVisible();
  await expect(page.locator('#center-console')).not.toBeChecked();
  await page.locator('.categoryButton').first().click();
  await expect(page).toHaveURL(/categories/);
  await page.getByRole('button', { name: '打开中控台', exact: true }).click();
  await expect(page.locator('#console .card-tag-cloud')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
