import { loadSurfaces } from './surfaces.js';

(async function () {
  'use strict';
  const U = window.UMRLosses;
  const $ = id => document.getElementById(id);
  const lab = document.querySelector('.lab'), scene = $('scene'), patch = $('patch');
  if (!U || !scene.getContext('2d') || !patch.getContext('2d')) return;
  let surfaces;
  try { surfaces = await loadSurfaces(); } catch (error) {
    $('fallback').textContent = error.message + '。请刷新重试；正文中的公式说明仍可阅读。';
    return;
  }
  const model = surfaces.model, terms = ['chamfer', 'repulsion', 'smooth'];
  lab.dataset.renderer = surfaces.mode;
  lab.dataset.robotLinks = String(surfaces.metadata.meshes.length - 1);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const options = { chamfer: true, repulsion: true, smooth: true, radius: .06, k: 6 };
  const zoomIds = model.zoomIds;
  const zoomSet = new Set(zoomIds);
  const contactIds = new Set(model.contactIds);
  let points = model.source.map(p => p.slice()), result;
  let iteration = 0, transfer = reducedMotion.matches ? 1 : 0, playing = !reducedMotion.matches;
  let raf = 0, lastTime = 0, angle = 18, selected = zoomIds[Math.floor(zoomIds.length / 2)], drawHitPoints = [];
  const visible = new Set();
  let colors;

  function syncTheme() {
    let theme = colorScheme.matches ? 'dark' : 'light';
    try { if (window.frameElement) theme = parent.document.documentElement.dataset.theme || theme; } catch (_) { /* standalone origin */ }
    document.documentElement.dataset.theme = theme;
    const css = getComputedStyle(document.documentElement);
    colors = Object.fromEntries(['bg', 'panel', 'text', 'muted', 'line', 'blue', 'target', 'green', 'orange', 'purple'].map(k => [k, css.getPropertyValue('--' + k).trim()]));
    draw();
  }

  function fit(canvas) {
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function project(p, x, base, scale) {
    const yaw = angle * Math.PI / 180, pitch = .12;
    const side = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
    const depth = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
    return [x + side * scale, base - (p[1] * Math.cos(pitch) - depth * Math.sin(pitch)) * scale, depth];
  }

  function circle(ctx, x, y, r, color) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill();
  }
  function line(ctx, a, b, color, width = 1) {
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function text(ctx, message, x, y, size = 12, color = colors.muted, align = 'center') {
    ctx.font = `${size}px system-ui, sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(message, x, y);
  }
  function arrow(ctx, a, b, color) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    if (len < 1.5) return;
    line(ctx, a, b, color, 1.5);
    const theta = Math.atan2(dy, dx), tip = Math.min(5, len / 2);
    line(ctx, b, [b[0] - tip * Math.cos(theta - .45), b[1] - tip * Math.sin(theta - .45)], color, 1.5);
    line(ctx, b, [b[0] - tip * Math.cos(theta + .45), b[1] - tip * Math.sin(theta + .45)], color, 1.5);
  }
  function drawCloud(ctx, cloud, origin, base, scale, target = false) {
    const projected = cloud.map((p, i) => [...project(p, origin, base, scale), i]);
    if (!target && $('graph').checked) {
      ctx.globalAlpha = .3;
      for (const [i, j] of model.edges) line(ctx, projected[i], projected[j], colors.blue, .6);
      ctx.globalAlpha = 1;
    }
    for (const p of projected.slice().sort((a, b) => a[2] - b[2])) {
      const marked = $('contact').checked && contactIds.has(p[3]);
      ctx.globalAlpha = target ? .4 : (p[2] < 0 ? .45 : .95);
      circle(ctx, p[0], p[1], target ? .85 : (marked ? 2.5 : 1.25), target ? colors.target : marked ? colors.orange : colors.blue);
    }
    ctx.globalAlpha = 1;
    if (!target) {
      const point = projected[selected];
      ctx.beginPath(); ctx.arc(point[0], point[1], 5.5, 0, Math.PI * 2); ctx.lineWidth = 1.5; ctx.strokeStyle = colors.text; ctx.stroke();
    }
    return projected;
  }

  function drawScene() {
    const { ctx, w, h } = fit(scene), mobile = w < 650;
    if (w < 80 || h < 100) return;
    const yaw = angle * Math.PI / 180, mode = $('region').value;
    const fullScale = Math.min(w * .405, (h - 100) / 1.02);
    const scale = fullScale * ({ body: 1, upper: 2.15, hand: 5.8 }[mode]);
    const centers = mode === 'body' ? [[0, .51, 0], [0, .51, 0]] : mode === 'upper' ? [[0, .79, 0], [0, .82, 0]] : [
      average(model.contactIds.map(i => model.source[i])),
      average(model.contactIds.map(i => model.target[result.nearest[i]]))
    ];
    const views = centers.map((center, i) => ({
      x: w * (i ? .75 : .25) - (center[0] * Math.cos(yaw) + center[2] * Math.sin(yaw)) * scale,
      base: h / 2 + 10 + (center[1] * Math.cos(.12) - (-center[0] * Math.sin(yaw) + center[2] * Math.cos(yaw)) * Math.sin(.12)) * scale,
      scale
    }));
    ctx.save(); ctx.beginPath(); ctx.rect(0, 60, w, h - 95); ctx.clip();
    surfaces.draw(ctx, w, h, views, angle, document.documentElement.dataset.theme === 'dark', $('surface').checked);
    drawHitPoints = [];
    for (let pane = 0; pane < 2; pane++) {
      ctx.save(); ctx.beginPath(); ctx.rect(pane * w / 2, 60, w / 2, h - 95); ctx.clip();
      const view = views[pane];
      const selectable = projected => projected.filter(p => p[0] >= pane * w / 2 && p[0] < (pane + 1) * w / 2 && p[1] >= 60 && p[1] < h - 35);
      if (!pane) drawHitPoints.push(...selectable(drawCloud(ctx, model.source, view.x, view.base, scale)));
      else {
        drawCloud(ctx, model.target, view.x, view.base, scale, true);
        if (transfer >= 1) drawHitPoints.push(...selectable(drawCloud(ctx, points, view.x, view.base, scale)));
      }
      ctx.restore();
    }
    if (transfer < 1) {
      // Initial copy is a visual transport between panes; the solver runs after it.
      const t = transfer * transfer * (3 - 2 * transfer);
      drawCloud(ctx, points, views[0].x + (views[1].x - views[0].x) * t,
        views[0].base + (views[1].base - views[0].base) * t, scale);
    }
    ctx.restore();
    line(ctx, [w / 2, 65], [w / 2, h - 37], colors.line);
    text(ctx, '人体模板 Xʰ', w * .25, 25, mobile ? 12 : 15, colors.text);
    text(ctx, '远征 A3 · Xʳ', w * .75, 25, mobile ? 12 : 15, colors.text);
    text(ctx, 'MakeHuman · 真实曲面网格', w * .25, 45, mobile ? 9 : 11);
    text(ctx, transfer < 1 ? '复制同一批点 →' : 'URDF · 优化对应位置 X̂ʳ', w * .75, 45, mobile ? 9 : 11);
    text(ctx, `同一索引 i = ${selected} · ${model.source.length} 个对应点`, w / 2, h - 14, mobile ? 10 : 12);
  }
  function average(points) {
    return [0, 1, 2].map(a => points.reduce((sum, p) => sum + p[a], 0) / points.length);
  }

  function drawPatch() {
    const { ctx, w, h } = fit(patch);
    if (w < 80 || h < 80) return;
    const scale = Math.min(w / .29, (h - 58) / .16);
    const center = average(zoomIds.map(i => points[i]));
    const xy = p => [w / 2 + (p[0] - center[0]) * scale, h / 2 - (p[1] - center[1] + p[2] * .35) * scale];
    const localId = zoomSet.has(selected) ? selected : zoomIds[Math.floor(zoomIds.length / 2)], localPoint = xy(points[localId]);
    ctx.save(); ctx.beginPath(); ctx.rect(1, 1, w - 2, h - 2); ctx.clip();
    if (options.repulsion) {
      ctx.globalAlpha = .09; circle(ctx, ...localPoint, options.radius * scale, colors.orange); ctx.globalAlpha = .5;
      ctx.beginPath(); ctx.arc(...localPoint, options.radius * scale, 0, Math.PI * 2); ctx.strokeStyle = colors.orange; ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.globalAlpha = .35;
    for (const [i, j] of model.edges) if (zoomSet.has(i) && zoomSet.has(j)) line(ctx, xy(points[i]), xy(points[j]), colors.target, .8);
    ctx.globalAlpha = 1;
    for (const p of model.target) if (Math.abs(p[0] - center[0]) < .14 && Math.abs(p[1] - center[1]) < .09) circle(ctx, ...xy(p), 2, colors.target);
    for (const i of zoomIds) circle(ctx, ...xy(points[i]), 3.3, colors.blue);
    const forceColors = { chamfer: colors.green, repulsion: colors.orange, smooth: colors.purple };
    for (const name of terms) {
      if (!options[name]) continue;
      const vectors = zoomIds.map(i => {
        const g = result.gradients[name][i]; return [-g[0], g[1] + g[2] * .35];
      });
      const max = Math.max(...vectors.map(g => Math.hypot(...g)), 1e-10);
      zoomIds.forEach((i, index) => {
        if (index % 4 !== 0) return;
        const a = xy(points[i]), v = vectors[index], length = Math.min(28, w * .08);
        arrow(ctx, a, [a[0] + length * v[0] / max, a[1] + length * v[1] / max], forceColors[name]);
      });
    }
    ctx.restore();
    text(ctx, '绿色：Chamfer   橙色：Repulsion   紫色：边平滑', w / 2, 20, w < 400 ? 10 : 12);
    text(ctx, '归一化坐标 · 真实前臂表面的投影', w / 2, h - 10, 10);
  }

  function draw() { if (colors && result) { drawScene(); drawPatch(); } }
  function recalculate() {
    result = U.evaluate(points, model.target, model.source, model.edges, options);
    for (const name of terms) {
      const label = { chamfer: 'Lc', repulsion: 'Lr', smooth: 'Le' }[name];
      $('loss-' + name).textContent = `${label} = ${result.losses[name].toExponential(2)}${options[name] ? '' : ' · 未参与更新'}`;
    }
    lab.dataset.iteration = String(iteration);
    $('iteration').textContent = transfer < 1 ? '正在复制模板点' : `优化 ${iteration} / 300 次`;
  }
  function syncPlayback() {
    $('play').textContent = playing ? '暂停' : iteration >= 300 ? '再次播放' : '播放';
    $('play').setAttribute('aria-pressed', String(playing));
    lab.dataset.running = String(playing);
    if (raf) cancelAnimationFrame(raf);
    raf = 0; lastTime = 0;
    if (playing && visible.size && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function report(message) { $('status').textContent = message; }
  function frame(now) {
    raf = 0;
    if (!playing || !visible.size || document.hidden) return;
    if (!lastTime || now - lastTime >= 32) {
      lastTime = now;
      if (transfer < 1) transfer = Math.min(1, transfer + .035);
      else {
        points = U.step(points, result); iteration++;
        if (iteration === 1) report('正在按启用的损失更新点位置。可关闭一项，观察前臂局部的运动变化。');
      }
      recalculate(); draw();
      if (iteration >= 300) {
        playing = false; syncPlayback(); report('本轮 300 次更新已结束。改变参数后可以继续播放；重新开始可比较相同初值。结束不代表全局最优。'); return;
      }
    }
    raf = requestAnimationFrame(frame);
  }
  function reset(withTransfer = true) {
    points = model.source.map(p => p.slice()); iteration = 0;
    transfer = withTransfer && !reducedMotion.matches ? 0 : 1;
    recalculate(); draw(); syncPlayback();
    report('已回到同一人体模板。表面索引保持不变，优化只改变右侧点的位置。');
  }

  $('play').addEventListener('click', () => {
    if (!playing && iteration >= 300) reset(false);
    playing = !playing; syncPlayback();
    report(playing ? '动画播放中。可切换损失或暂停后单步观察。' : '动画已暂停。可以调节参数，再单步查看更新方向。');
  });
  $('reset').addEventListener('click', () => reset());
  $('step').addEventListener('click', () => {
    playing = false; transfer = 1; if (iteration >= 300) iteration = 0;
    points = U.step(points, result); iteration++; recalculate(); draw(); syncPlayback();
    report(`已完成一次梯度更新，当前第 ${iteration} 次。灰点固定，蓝点按照启用的损失移动。`);
  });
  $('perturb').addEventListener('click', () => {
    transfer = 1; iteration = 0;
    points = points.map((p, i) => p.map((v, a) => v + .014 * Math.sin((i + 1) * (a + 3) * 1.7)));
    recalculate(); draw(); report('已施加固定、可重复的小扰动。观察源表面邻居的位移如何在平滑项作用下变得连贯。');
  });
  for (const name of terms) $(name).addEventListener('change', () => {
    options[name] = $(name).checked; iteration = 0; recalculate(); draw();
    report(terms.every(k => !options[k]) ? '三项均已关闭，点将保持原位。启用任意一项后可继续观察。' : '损失设置已改变，保留当前点位置。若需要比较相同初值，请点击“重新开始”。');
  });
  $('radius').addEventListener('input', () => {
    options.radius = Number($('radius').value); $('radius-value').textContent = options.radius.toFixed(3);
    iteration = 0; recalculate(); draw();
  });
  $('radius').addEventListener('change', () => report(`排斥尺度 r = ${options.radius.toFixed(3)}，单位为归一化长度。改变尺度同时改变惩罚分布和梯度。`));
  $('defaults').addEventListener('click', () => {
    for (const name of terms) { options[name] = true; $(name).checked = true; }
    options.radius = .06; $('radius').value = '.06'; $('radius-value').textContent = '0.060'; reset(false);
  });
  $('yaw').addEventListener('input', () => { angle = Number($('yaw').value); $('yaw-value').textContent = angle + '°'; draw(); });
  $('region').addEventListener('change', () => { transfer = 1; draw(); report('已切换观察区域。优化仍在全身点集上进行，视图缩放不改变损失。'); });
  $('surface').addEventListener('change', draw);
  for (const id of ['contact', 'graph']) $(id).addEventListener('change', () => {
    draw(); report(id === 'contact' ? '橙色点示意同一片接触区域的索引迁移；颜色不参与损失，也不代表接触已经成立。' : '邻接沿人体三角网格的边路径计算并固定，不会随着机器人点的欧氏距离重新连边。');
  });
  scene.addEventListener('click', event => {
    const rect = scene.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
    let best = 18 ** 2, next = selected;
    for (const p of drawHitPoints) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < best) { best = d; next = p[3]; } }
    selected = next; draw(); report(`选中索引 i = ${selected}。两侧圈出的点拥有相同身份，右侧位置由损失优化。下方持续放大右前臂区域。`);
  });

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); }
    syncPlayback();
  });
  observer.observe(scene); observer.observe(patch);
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { playing = false; syncPlayback(); report('已遵循减少动态效果偏好，动画暂停。仍可主动播放或单步查看。'); } });
  colorScheme.addEventListener('change', syncTheme);
  let parentThemeObserver;
  try {
    if (window.frameElement) {
      parentThemeObserver = new MutationObserver(syncTheme);
      parentThemeObserver.observe(parent.document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
  } catch (_) { /* host can still use system colour preference */ }
  let embedResizeTimer = 0;
  function syncEmbedHeight() {
    try {
      if (window.frameElement?.hasAttribute('data-umr-embed') && lab.getBoundingClientRect().width >= 220) {
        window.frameElement.style.height = Math.ceil(lab.getBoundingClientRect().height + 2) + 'px';
      }
    } catch (_) { /* separate origin */ }
  }
  const resize = new ResizeObserver(() => {
    draw();
    // Wait out the host theme's responsive width transition before sizing the iframe.
    clearTimeout(embedResizeTimer);
    embedResizeTimer = setTimeout(syncEmbedHeight, 120);
  });
  resize.observe(document.querySelector('.lab'));
  window.addEventListener('pagehide', event => { if (!event.persisted) surfaces.dispose(); if (raf) cancelAnimationFrame(raf); clearTimeout(embedResizeTimer); observer.disconnect(); resize.disconnect(); parentThemeObserver?.disconnect(); });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    observer.observe(scene); observer.observe(patch); resize.observe(lab);
    try { parentThemeObserver?.observe(parent.document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (_) { /* separate origin */ }
    syncTheme(); syncPlayback();
  });
  $('render-note').textContent = surfaces.mode === 'webgl' ? '实体网格 + 表面采样点 · 可切换上身或手部特写' : '当前设备使用真实网格线框显示，点位置优化仍可操作。';
  $('fallback').hidden = true; $('controls').disabled = false;
  recalculate(); syncTheme(); syncPlayback();
  if (reducedMotion.matches) report('已遵循减少动态效果偏好，默认暂停。点击播放或单步即可观察。');
  lab.dataset.umrReady = 'true';
})();
