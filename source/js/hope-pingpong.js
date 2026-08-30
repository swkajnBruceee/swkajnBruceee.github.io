(function () {
  'use strict';

  const modes = {
    gravity: { label: '重力', color: '#e8f0eb', detail: '只考虑重力，轨迹保持理想抛物线' },
    drag: { label: '重力 + 空气阻力', color: '#e8a65e', detail: '加入与速度平方相关的阻力项' },
    spin: { label: '重力 + 空气阻力 + 旋转项', color: '#d56b35', detail: '加入旋转造成的竖直偏移' }
  };

  function setupLab(lab) {
    if (lab.dataset.hopeReady === 'true') return;
    const canvas = lab.querySelector('[data-hope-canvas]');
    const context = canvas && canvas.getContext('2d');
    const readout = lab.querySelector('[data-hope-readout]');
    const buttons = [...lab.querySelectorAll('[data-hope-mode]')];
    const reset = lab.querySelector('[data-hope-reset]');
    if (!context) return;

    let mode = 'gravity';
    let epoch = 0;
    let animationFrame = 0;
    let lastPoints = [];

    function simulate(selectedMode) {
      const points = [];
      let x = 0;
      let y = 1.48;
      let vx = 7.1;
      let vy = 3.8;
      const dt = 0.012;

      for (let i = 0; i < 160; i += 1) {
        const drag = selectedMode === 'gravity' ? 0 : 0.074;
        const spinLift = selectedMode === 'spin' ? 1.8 : 0;
        const speed = Math.hypot(vx, vy);
        const ax = -drag * speed * vx;
        const ay = -9.81 - drag * speed * vy + spinLift * vx;
        points.push({ x, y });
        vx += ax * dt;
        vy += ay * dt;
        x += vx * dt;
        y += vy * dt;

        if (y < 0.06 && vy < 0) {
          y = 0.06;
          vy *= -0.68;
          vx *= 0.86;
        }
        if (x > 12.2 || y > 5.2) break;
      }
      return points;
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(rect.width || 920, 320);
      const height = Math.max(Math.min(width * 420 / 920, 420), 220);
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      return { width, height };
    }

    function drawGrid(width, height) {
      const plot = { left: 48, right: 20, top: 30, bottom: 48 };
      const plotWidth = width - plot.left - plot.right;
      const plotHeight = height - plot.top - plot.bottom;
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#06111c';
      context.fillRect(0, 0, width, height);

      context.strokeStyle = 'rgba(184, 221, 216, .1)';
      context.lineWidth = 1;
      for (let i = 0; i <= 5; i += 1) {
        const y = plot.top + plotHeight * i / 5;
        context.beginPath();
        context.moveTo(plot.left, y);
        context.lineTo(width - plot.right, y);
        context.stroke();
      }
      for (let i = 0; i <= 6; i += 1) {
        const x = plot.left + plotWidth * i / 6;
        context.beginPath();
        context.moveTo(x, plot.top);
        context.lineTo(x, height - plot.bottom);
        context.stroke();
      }

      context.strokeStyle = '#b9d4d1';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(plot.left, height - plot.bottom);
      context.lineTo(width - plot.right, height - plot.bottom);
      context.stroke();

      const netX = plot.left + plotWidth * 6.2 / 12.2;
      context.strokeStyle = '#d56b35';
      context.setLineDash([7, 7]);
      context.beginPath();
      context.moveTo(netX, plot.top);
      context.lineTo(netX, height - plot.bottom);
      context.stroke();
      context.setLineDash([]);

      context.fillStyle = '#9bb9b8';
      context.font = '12px Arial, sans-serif';
      context.fillText('x / flight distance', Math.max(plot.left, width - 150), height - 20);
      context.fillText('z / height', 12, 20);
      context.fillStyle = '#f3d6a3';
      context.fillText('net plane', Math.max(plot.left + 4, netX - 28), 20);
      return plot;
    }

    function drawTrajectory(points, selectedMode, progress, width, height, plot) {
      const plotWidth = width - plot.left - plot.right;
      const plotHeight = height - plot.top - plot.bottom;
      const mapPoint = point => ({
        x: plot.left + point.x / 12.2 * plotWidth,
        y: height - plot.bottom - point.y / 5.2 * plotHeight
      });
      const end = Math.max(2, Math.min(points.length, Math.floor(points.length * progress)));

      context.strokeStyle = modes[selectedMode].color;
      context.lineWidth = 3;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.beginPath();
      for (let i = 0; i < end; i += 1) {
        const point = mapPoint(points[i]);
        if (i === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      }
      context.stroke();

      const ball = mapPoint(points[end - 1]);
      context.fillStyle = modes[selectedMode].color;
      context.shadowColor = modes[selectedMode].color;
      context.shadowBlur = 14;
      context.beginPath();
      context.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }

    function draw(progress) {
      const { width, height } = resizeCanvas();
      const plot = drawGrid(width, height);
      drawTrajectory(lastPoints, mode, progress, width, height, plot);
      if (readout) readout.textContent = `模型：${modes[mode].label} · ${modes[mode].detail}`;
    }

    function render() {
      epoch += 1;
      const currentEpoch = epoch;
      lastPoints = simulate(mode);
      cancelAnimationFrame(animationFrame);
      const start = performance.now();

      function frame(now) {
        if (currentEpoch !== epoch) return;
        const progress = Math.min(1, (now - start) / 1700);
        draw(progress);
        if (progress < 1) animationFrame = requestAnimationFrame(frame);
      }
      animationFrame = requestAnimationFrame(frame);
    }

    buttons.forEach(button => {
      const selected = button.dataset.hopeMode === mode;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.addEventListener('click', () => {
        if (!modes[button.dataset.hopeMode]) return;
        mode = button.dataset.hopeMode;
        buttons.forEach(item => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        render();
      });
    });

    if (reset) reset.addEventListener('click', render);
    if (typeof ResizeObserver === 'function') new ResizeObserver(render).observe(canvas);
    window.addEventListener('resize', render, { passive: true });
    lab.dataset.hopeReady = 'true';
    render();
  }

  function init() {
    document.querySelectorAll('[data-hope-trajectory-lab]').forEach(setupLab);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('pjax:complete', init);
})();
