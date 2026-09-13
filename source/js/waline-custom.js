// 只观察当前评论区；页面切换时断开，避免轮询和反复移动评论节点。
(function () {
  'use strict';
  let observer;
  const avatarFor = value => {
    let hash = 0;
    for (const char of value) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return `/img/avatars/avatar${Math.abs(hash) % 6 + 1}.svg`;
  };

  function enhance(container) {
    container.querySelectorAll('.wl-editor').forEach(editor => {
      if (editor.dataset.blogEnhanced) return;
      editor.dataset.blogEnhanced = 'true';
      const tip = document.createElement('div');
      tip.className = 'wl-editor-info';
      tip.textContent = '支持 Markdown 格式';
      editor.parentElement.appendChild(tip);
      editor.addEventListener('focus', () => tip.classList.add('active'));
      editor.addEventListener('blur', () => tip.classList.remove('active'));
    });
    container.querySelectorAll('.wl-avatar img, img.wl-avatar, .wl-user-avatar img').forEach(img => {
      if (!img.src || img.dataset.blogAvatar === img.src) return;
      try {
        const host = new URL(img.src).hostname;
        if (!/(^|\.)(gravatar\.com|cravatar\.cn|loli\.net)$/.test(host)) return;
        img.src = avatarFor(img.src);
        img.dataset.blogAvatar = img.src;
      } catch { /* 保留用户头像。 */ }
    });
  }

  function init() {
    observer?.disconnect();
    const container = document.getElementById('waline-wrap');
    if (!container) return;
    enhance(container);
    observer = new MutationObserver(() => enhance(container));
    observer.observe(container, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  document.addEventListener('pjax:send', () => observer?.disconnect());
  document.addEventListener('pjax:complete', init);
})();
