const { test, expect } = require('@playwright/test');

const origin = 'http://127.0.0.1:4173';
const fixturePath = '/__music_fixture__/';
const tracks = [
  { name: '播放测试一', artist: '本地测试音', url: `${origin}${fixturePath}first.wav`, pic: `${origin}${fixturePath}cover.svg`, lrc: `${origin}${fixturePath}lyrics.lrc` },
  { name: '播放测试二', artist: '本地测试音', url: `${origin}${fixturePath}second.wav`, pic: `${origin}${fixturePath}cover.svg`, lrc: `${origin}${fixturePath}lyrics.lrc` }
];

// 运行时生成 20 秒 PCM 音调，验证浏览器确实解码并播放音频，不依赖歌曲版权或外部音源。
function makeWav(frequency) {
  const sampleRate = 8000;
  const samples = sampleRate * 20;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i += 1) wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * frequency * i / sampleRate) * 1000), 44 + i * 2);
  return wav;
}

const audioFixtures = { 'first.wav': makeWav(220), 'second.wav': makeWav(330) };

async function mockMusicSource(page, responses = [{ status: 200, body: JSON.stringify(tracks) }]) {
  let playlistRequests = 0;
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === 'api.injahow.cn' && url.searchParams.get('type') === 'playlist') {
      const response = responses[Math.min(playlistRequests, responses.length - 1)];
      playlistRequests += 1;
      return route.fulfill({ ...response, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    if (url.origin !== origin) return route.abort();
    if (!url.pathname.startsWith(fixturePath)) return route.continue();
    const name = url.pathname.slice(fixturePath.length);
    if (name === 'cover.svg') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#4976d5"/></svg>' });
    if (name === 'lyrics.lrc') return route.fulfill({ contentType: 'text/plain', body: '[00:00.00]本地音频测试\n[00:10.00]第二段音频测试' });
    const audio = audioFixtures[name];
    if (!audio) return route.fulfill({ status: 404 });
    const range = request.headers().range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Math.min(range[2] ? Number(range[2]) : audio.length - 1, audio.length - 1);
      return route.fulfill({ status: 206, contentType: 'audio/wav', headers: { 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${audio.length}` }, body: audio.subarray(start, end + 1) });
    }
    return route.fulfill({ contentType: 'audio/wav', headers: { 'Accept-Ranges': 'bytes' }, body: audio });
  });
  return () => playlistRequests;
}

const pageErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  pageErrors.set(page, []);
  page.on('pageerror', error => pageErrors.get(page).push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), '音乐接口异常应被处理，不能产生未捕获的脚本错误').toEqual([]);
});

test('歌单 403 超过旧降级时限仍显示音乐入口，中控按钮和重试均可用', async ({ page }) => {
  const requests = await mockMusicSource(page, [{ status: 403, body: 'forbidden' }, { status: 200, body: JSON.stringify(tracks) }]);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.clock.install();
  await page.goto('/');
  const player = page.locator('#nav-music meting-js');
  await expect(player).toHaveAttribute('data-state', 'error');
  await page.clock.fastForward(13000);
  await expect(page.locator('#nav-music')).toBeInViewport();
  await expect(page.getByRole('button', { name: '重新加载歌单' })).toBeVisible();
  await page.getByRole('button', { name: '打开中控台', exact: true }).click();
  await expect(page.locator('#consoleMusic')).toBeVisible();
  await expect(page.locator('#consoleMusic')).toHaveAttribute('aria-label', '重试加载音乐');
  await page.getByRole('button', { name: '关闭中控台', exact: true }).click();
  await page.getByRole('button', { name: '重新加载歌单' }).click();
  await expect(player).toHaveAttribute('data-state', 'ready');
  await expect(player.locator('.aplayer-list li')).toHaveCount(2);
  expect(requests()).toBe(2);
});

test('真实音频播放、暂停和下一首同步导航与中控状态', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockMusicSource(page);
  await page.goto('/');
  await expect(page.locator('#nav-music meting-js')).toHaveAttribute('data-state', 'ready');
  await page.getByRole('button', { name: '打开中控台', exact: true }).click();
  await page.locator('#consoleMusic').click();
  await expect.poll(() => page.evaluate(() => document.querySelector('#nav-music meting-js').aplayer.audio.currentTime)).toBeGreaterThan(0.1);
  await expect(page.locator('#nav-music')).toHaveClass(/playing/);
  await expect(page.locator('#consoleMusic')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#consoleMusic').click();
  expect(await page.evaluate(() => document.querySelector('#nav-music meting-js').aplayer.audio.paused)).toBe(true);
  await expect(page.locator('#nav-music')).not.toHaveClass(/playing/);
  await expect(page.locator('#consoleMusic')).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: '关闭中控台', exact: true }).click();
  await page.locator('#nav-music-hoverTips').click();
  await expect(page.locator('#nav-music')).toHaveClass(/playing/);
  const before = await page.evaluate(() => document.querySelector('#nav-music meting-js').aplayer.audio.src);
  await page.locator('#nav-music').click({ button: 'right' });
  await page.locator('#menu-music-forward').click();
  await expect.poll(() => page.evaluate(() => document.querySelector('#nav-music meting-js').aplayer.audio.src)).not.toBe(before);
  await expect.poll(() => page.evaluate(() => document.querySelector('#nav-music meting-js').aplayer.audio.currentTime)).toBeGreaterThan(0.1);
  await page.locator('#nav-music .aplayer-pic .aplayer-button').click();
  await expect(page.locator('#nav-music')).not.toHaveClass(/playing/);
  await expect(page.locator('#consoleMusic')).toHaveAttribute('aria-pressed', 'false');
});

test('PJAX 切页保留正在播放的实例，歌单不会重复请求', async ({ page }) => {
  const requests = await mockMusicSource(page);
  await page.goto('/');
  await expect(page.locator('#nav-music meting-js')).toHaveAttribute('data-state', 'ready');
  await page.locator('#nav-music-hoverTips').click();
  await expect.poll(() => page.evaluate(() => document.querySelector('#nav-music meting-js').aplayer.audio.currentTime)).toBeGreaterThan(0.1);
  await page.evaluate(() => { window.musicRegressionPlayer = document.querySelector('#nav-music meting-js').aplayer; });
  await page.locator('.categoryButton').first().click();
  await expect(page).toHaveURL(/\/categories\//);
  await expect(page.locator('#nav-music .aplayer')).toHaveCount(1);
  expect(await page.evaluate(() => document.querySelector('#nav-music meting-js').aplayer === window.musicRegressionPlayer)).toBe(true);
  expect(await page.evaluate(() => window.musicRegressionPlayer.audio.paused)).toBe(false);
  await expect(page.locator('#nav-music')).toHaveClass(/playing/);
  await page.getByRole('button', { name: '打开中控台', exact: true }).click();
  await expect(page.locator('#consoleMusic')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#consoleMusic').click();
  expect(await page.evaluate(() => window.musicRegressionPlayer.audio.paused)).toBe(true);
  expect(requests()).toBe(1);
});

test('窄屏遇到坏 JSON 仍可重试，恢复后播放器不超出屏幕', async ({ page }) => {
  await mockMusicSource(page, [{ status: 200, body: '{invalid' }, { status: 200, body: JSON.stringify(tracks) }]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#nav-music meting-js')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#nav-music')).toBeInViewport();
  await page.getByRole('button', { name: '重新加载歌单' }).click();
  await expect(page.locator('#nav-music meting-js')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#nav-music')).toBeInViewport();
  expect(await page.locator('#nav-music').evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= 0 && bounds.right <= innerWidth;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
