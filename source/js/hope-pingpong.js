(function () {
  'use strict';

  const modes = {
    gravity: { label: '重力', color: '#e8a65e', detail: '只考虑重力，轨迹保持理想抛物线' },
    drag: { label: '空气阻力', color: '#8fd0c0', detail: '加入与速度平方相关的阻力项' },
    spin: { label: '旋转项', color: '#f3d6a3', detail: '加入旋转造成的横向偏移' }
  };

  function setupLab(lab) {
    if (lab.dataset.hopeReady === 'true') return;
    const canvas = lab.querySelector('[data-hope-canvas]');
    const readout = lab.querySelector('[data-hope-readout]');
    const buttons = [...lab.querySelectorAll('[data-hope-mode]')];
    const reset = lab.querySelector('[data-hope-reset]');
    if (!canvas || !canvas.getContext) return;

    const context = canvas.getContext('2d');
    let mode = 'gravity';

    function draw() {
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(canvas.clientWidth || 920, 320);
      const height = Math.max(canvas.clientHeight || width * 420 / 920, 220);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const pad = { left: 38, right: 22, top: 28, bottom: 34 };
      const plotWidth = width - pad.left - pad.right;
      const plotHeight = height - pad.top - pad.bottom;
      context.fillStyle = '#07131f';
      context.fillRect(0, 0, width, height);

      context.strokeStyle = 'rgba(168, 200, 195, .13)';
      context.lineWidth = 1;
      for (let i = 0; i <= 4; i += 1) {
        const y = pad.top + plotHeight * i / 4;
        context.beginPath();
        context.moveTo(pad.left, y);
        context.lineTo(width - pad.right, y);
        context.stroke();
      }
      for (let i = 0; i <= 6; i += 1) {
        const x = pad.left + plotWidth * i / 6;
        context.beginPath();
        context.moveTo(x, pad.top);
        context.lineTo(x, height - pad.bottom);
        context.stroke();
      }

      context.strokeStyle = 'rgba(232, 240, 235, .4)';
      context.beginPath();
      context.moveTo(pad.left, height - pad.bottom);
      context.lineTo(width - pad.right, height - pad.bottom);
      context.stroke();

      Object.entries(modes).forEach(([key, info], index) => {
        context.setLineDash(key === mode ? [] : [5, 5]);
        context.strokeStyle = info.color;
        context.globalAlpha = key === mode ? 1 : .42;
        context.lineWidth = key === mode ? 3 : 2;
        context.beginPath();
        for (let step = 0; step <= 80; step += 1) {
          const t = step / 80;
          const arc = 4 * t * (1 - t);
          const dragShift = key === 'drag' ? -.06 * t * t : 0;
          const spinShift = key === 'spin' ? .08 * Math.sin(Math.PI * t) : 0;
          const x = pad.left + plotWidth * (t + dragShift + spinShift * .35);
          const y = pad.top + plotHeight * (.86 - arc * .72 - (key === 'drag' ? .05 * t : 0));
          if (step === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();

        const endX = pad.left + plotWidth * (.82 + (key === 'spin' ? .028 : 0));
        const endY = pad.top + plotHeight * (.86 - .72 - (key === 'drag' ? .05 : 0));
        context.fillStyle = info.color;
        context.globalAlpha = key === mode ? 1 : .42;
        context.beginPath();
        context.arc(endX, endY, key === mode ? 5 : 3.5, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#9bb9b8';
        context.font = '12px Arial, sans-serif';
        context.fillText(`${index + 1}. ${info.label}`, pad.left + 10 + index * 108, 17);
      });
      context.globalAlpha = 1;
      context.setLineDash([]);

      if (readout) readout.textContent = `模型：${modes[mode].label} · ${modes[mode].detail}`;
    }

    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.hopeMode === mode));
      button.addEventListener('click', () => {
        if (!modes[button.dataset.hopeMode]) return;
        mode = button.dataset.hopeMode;
        buttons.forEach(item => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        draw();
      });
    });

    if (reset) {
      reset.addEventListener('click', () => {
        mode = 'gravity';
        buttons.forEach(item => {
          const active = item.dataset.hopeMode === mode;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        draw();
      });
    }

    if (typeof ResizeObserver === 'function') new ResizeObserver(draw).observe(canvas);
    window.addEventListener('resize', draw, { passive: true });
    lab.dataset.hopeReady = 'true';
    draw();
  }

  function init() {
    document.querySelectorAll('[data-hope-trajectory-lab]').forEach(setupLab);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('pjax:complete', init);
})();
