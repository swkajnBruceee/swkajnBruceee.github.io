// 修复夜间模式按钮点击和跨 PJAX 页面持久化问题。
(function() {
  'use strict';
  function persistTheme(theme) {
    if (window.saveToLocal?.set) window.saveToLocal.set('theme', theme, 2);
    else localStorage.setItem('theme', JSON.stringify({ value: theme, expiry: Date.now() + 2 * 86400000 }));
  }

  function toggleTheme(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);

      try {
        persistTheme(newTheme);
      } catch (error) {
        console.warn('保存主题设置失败:', error);
      }

      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const themeColor = newTheme === 'dark' ? '#1a202c' : '#ffffff';
        metaThemeColor.setAttribute('content', themeColor);
      }
      if (window.anzhiyu?.snackbarShow) window.anzhiyu.snackbarShow(newTheme === 'dark' ? '已切换到夜间模式' : '已切换到日间模式');
  }

  // 使用事件代理，保证 PJAX 替换导航按钮后仍然有效。
  document.addEventListener('click', event => {
    if (event.target.closest('#darkmode')) toggleTheme(event);
  }, true);

  window.toggleDarkMode = function() {
    const darkmodeButton = document.getElementById('darkmode');
    if (darkmodeButton) darkmodeButton.click();
    else toggleTheme();
  };
})();
