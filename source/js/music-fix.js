// 等待异步播放器完成初始化，超时或接口失败才隐藏入口；晚到的播放器仍可恢复。
(function () {
  'use strict';
  let timer;
  function update() {
    const ready = Boolean(document.querySelector('#nav-music meting-js')?.aplayer);
    const selectors = '#nav-music, #consoleMusic, #menu-music-toggle, #menu-music-back, #menu-music-forward, #menu-music-playlist, #menu-music-copyMusicName';
    document.querySelectorAll(selectors).forEach(element => { element.hidden = !ready; });
  }
  function init() {
    const player = document.querySelector('#nav-music meting-js');
    if (player) {
      const observer = new MutationObserver(() => {
        if (player.aplayer) { update(); observer.disconnect(); }
      });
      observer.observe(player, { childList: true, subtree: true });
    }
    clearTimeout(timer);
    timer = setTimeout(update, 12000);
  }
  document.addEventListener('aplayer:ready', update);
  window.addEventListener('load', init, { once: true });
  document.addEventListener('pjax:complete', update);
})();
