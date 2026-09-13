// 所有主题切换入口共用同一套持久化与插件通知。
(function () {
  'use strict';
  function toggleTheme() {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    const activate = theme === 'dark' ? window.activateDarkMode : window.activateLightMode;
    if (activate) activate();
    else document.documentElement.dataset.theme = theme;
    window.saveToLocal?.set('theme', theme, 2);
    for (const callback of Object.values(window.globalFn?.themeChange || {})) callback(theme);
    const text = document.querySelector('.menu-darkmode-text');
    if (text) text.textContent = theme === 'dark' ? '浅色模式' : '深色模式';
    window.rm?.hideRightMenu();
    if (window.Snackbar && window.GLOBAL_CONFIG?.Snackbar) anzhiyu.snackbarShow(theme === 'dark' ? '已切换到夜间模式' : '已切换到日间模式');
  }
  document.addEventListener('click', event => {
    if (!event.target.closest('#darkmode, .darkmode_switchbutton, #menu-darkmode')) return;
    event.preventDefault();
    event.stopPropagation();
    toggleTheme();
  }, true);
  window.toggleDarkMode = toggleTheme;
})();
