// 音乐服务不可用时安全降级，避免第三方接口失败影响博客其他功能。
(function () {
  'use strict';

  function disableUnavailableMusic() {
    const player = document.querySelector('#nav-music meting-js')?.aplayer;
    if (player) return;

    document.querySelector('#nav-music')?.setAttribute('hidden', 'hidden');
    document.querySelector('#consoleMusic')?.setAttribute('hidden', 'hidden');
    document.querySelectorAll('#menu-music-toggle, #menu-music-back, #menu-music-forward, #menu-music-playlist, #menu-music-copyMusicName')
      .forEach(item => item.setAttribute('hidden', 'hidden'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', disableUnavailableMusic);
  else disableUnavailableMusic();
  document.addEventListener('pjax:complete', disableUnavailableMusic);
})();
