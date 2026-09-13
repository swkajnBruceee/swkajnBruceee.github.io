// 导航与中控台共享真实播放状态；接口故障时保留入口和重试按钮。
(function () {
  'use strict';
  const bound = new WeakSet();
  function update() {
    const nav = document.getElementById('nav-music');
    const element = nav?.querySelector('meting-js');
    if (!element) return;
    const player = element.aplayer;
    const state = element.dataset.state || 'loading';
    const playing = Boolean(player && !player.audio.paused && !player.audio.error);
    const label = state === 'loading' ? '音乐加载中' : state === 'error' ? '重试加载音乐' : playing ? '暂停音乐' : '播放音乐';
    nav.dataset.state = state;
    nav.hidden = false;
    nav.classList.toggle('playing', playing);
    nav.classList.toggle('stretch', playing);
    anzhiyu_musicPlaying = playing;
    const tip = document.getElementById('nav-music-hoverTips');
    if (tip) {
      tip.textContent = label;
      tip.setAttribute('aria-label', label);
    }
    const control = document.getElementById('consoleMusic');
    if (control) {
      control.hidden = false;
      control.classList.toggle('on', playing);
      control.title = label;
      control.setAttribute('aria-label', label);
      control.setAttribute('aria-pressed', String(playing));
    }
    const menu = document.getElementById('menu-music-toggle');
    if (menu) {
      menu.hidden = false;
      menu.innerHTML = `<i class="anzhiyufont anzhiyu-icon-${playing ? 'pause' : 'play'}"></i><span>${label}</span>`;
    }
    if (player && !bound.has(player)) {
      bound.add(player);
      ['play', 'pause', 'ended', 'error'].forEach(event => player.on(event, update));
      anzhiyu.musicBindEvent();
    }
  }
  document.addEventListener('meting:statechange', update);
  document.addEventListener('aplayer:ready', update);
  document.addEventListener('pjax:complete', update);
  window.addEventListener('load', update, { once: true });
})();
