// 轻量级站内搜索。搜索数据由根目录 search.xml 提供，不依赖第三方服务。
(function () {
  'use strict';

  let searchData = [];
  let dataPromise;

  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  function addStyles() {
    if (document.getElementById('blog-search-styles')) return;
    const style = document.createElement('style');
    style.id = 'blog-search-styles';
    style.textContent = `
      #blog-search-modal { position: fixed; inset: 0; z-index: 1005; display: flex; align-items: flex-start; justify-content: center; padding: 12vh 1rem 1rem; background: rgba(0,0,0,.45); }
      #blog-search-modal[hidden] { display: none; }
      .blog-search-dialog { width: min(720px, 100%); max-height: 70vh; overflow: hidden; border-radius: 16px; background: var(--anzhiyu-card-bg, #fff); box-shadow: 0 12px 40px rgba(0,0,0,.25); }
      .blog-search-head { display: flex; gap: .75rem; padding: 1rem; border-bottom: 1px solid var(--anzhiyu-secondbg, #eee); }
      .blog-search-head input { flex: 1; min-width: 0; padding: .7rem 1rem; border: 1px solid #d9dce8; border-radius: 999px; background: transparent; color: inherit; outline: none; }
      .blog-search-head input:focus { border-color: var(--anzhiyu-theme, #425aef); }
      .blog-search-close { border: 0; background: transparent; color: inherit; font-size: 1.2rem; cursor: pointer; }
      .blog-search-results { max-height: 55vh; overflow-y: auto; padding: .5rem; }
      .blog-search-item { display: block; padding: .85rem 1rem; border-radius: 10px; color: inherit; text-decoration: none; }
      .blog-search-item:hover { background: var(--anzhiyu-theme-op, rgba(66,90,239,.1)); }
      .blog-search-title { font-weight: 700; color: var(--anzhiyu-theme, #425aef); }
      .blog-search-content, .blog-search-empty { margin-top: .3rem; color: var(--anzhiyu-secondtext, #858585); line-height: 1.6; }
      .blog-search-trigger { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; color: inherit; cursor: pointer; }
      @media (max-width: 768px) { #blog-search-modal { padding-top: 8vh; } .blog-search-dialog { max-height: 80vh; } }
    `;
    document.head.appendChild(style);
  }

  function createModal() {
    if (document.getElementById('blog-search-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'blog-search-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '站内搜索');
    modal.innerHTML = `
      <div class="blog-search-dialog">
        <div class="blog-search-head">
          <input id="blog-search-input" type="search" placeholder="搜索文章标题或内容" autocomplete="off">
          <button class="blog-search-close" type="button" aria-label="关闭搜索">×</button>
        </div>
        <div id="blog-search-results" class="blog-search-results"><div class="blog-search-empty">正在加载搜索数据…</div></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target === modal || event.target.closest('.blog-search-close')) closeSearch();
      const result = event.target.closest('.blog-search-item');
      if (result) {
        const url = result.getAttribute('data-url');
        if (url) window.pjax ? window.pjax.loadUrl(url) : (window.location.href = url);
        closeSearch();
      }
    });
    modal.querySelector('#blog-search-input').addEventListener('input', event => renderResults(event.target.value));
  }

  async function loadData() {
    if (dataPromise) return dataPromise;
    dataPromise = fetch('/search.xml')
      .then(response => {
        if (!response.ok) throw new Error(`search.xml: ${response.status}`);
        return response.text();
      })
      .then(text => {
        const xml = new DOMParser().parseFromString(text, 'text/xml');
        if (xml.querySelector('parsererror')) throw new Error('search.xml is invalid XML');
        searchData = [...xml.querySelectorAll('entry')].map(entry => ({
          title: entry.querySelector('title')?.textContent || '',
          content: entry.querySelector('content')?.textContent || '',
          url: entry.querySelector('url')?.textContent || '/'
        }));
        return searchData;
      })
      .catch(error => {
        console.warn('Search data loading failed:', error);
        searchData = [];
        return searchData;
      });
    return dataPromise;
  }

  function renderResults(query) {
    const container = document.getElementById('blog-search-results');
    if (!container) return;
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      container.innerHTML = '<div class="blog-search-empty">请输入关键词开始搜索</div>';
      return;
    }
    const keywords = keyword.split(/\s+/).filter(Boolean);
    const results = searchData
      .map(item => {
        const title = item.title.toLowerCase();
        const content = item.content.toLowerCase();
        const haystack = `${title} ${content}`;
        if (!keywords.every(itemKeyword => haystack.includes(itemKeyword))) return null;
        const score = keywords.reduce((total, itemKeyword) => {
          return total + (title.includes(itemKeyword) ? 10 : 0) + (content.includes(itemKeyword) ? 1 : 0);
        }, 0);
        return { ...item, score };
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score)
      .slice(0, 10);
    if (!results.length) {
      container.innerHTML = `<div class="blog-search-empty">未找到包含“${escapeHtml(query)}”的文章</div>`;
      return;
    }
    container.innerHTML = results.map(item => `
      <a class="blog-search-item" href="${escapeHtml(item.url)}" data-url="${escapeHtml(item.url)}">
        <div class="blog-search-title">${escapeHtml(item.title)}</div>
        <div class="blog-search-content">${escapeHtml(item.content.slice(0, 140))}</div>
      </a>`).join('');
  }

  function openSearch() {
    createModal();
    const modal = document.getElementById('blog-search-modal');
    const input = document.getElementById('blog-search-input');
    modal.hidden = false;
    loadData().then(() => renderResults(input.value));
    input.focus();
  }

  function closeSearch() {
    const modal = document.getElementById('blog-search-modal');
    if (modal) modal.hidden = true;
  }

  function init() {
    addStyles();
    createModal();
    document.addEventListener('click', event => {
      if (event.target.closest('#menu-search, #search-button, .blog-search-trigger')) {
        event.preventDefault();
        openSearch();
      }
    });
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
      } else if (event.key === 'Escape') closeSearch();
    });
    const navRight = document.getElementById('nav-right');
    if (navRight && !navRight.querySelector('.blog-search-trigger')) {
      const trigger = document.createElement('a');
      trigger.className = 'blog-search-trigger';
      trigger.href = '#search';
      trigger.setAttribute('aria-label', '站内搜索');
      trigger.innerHTML = '<i class="anzhiyufont anzhiyu-icon-magnifying-glass"></i>';
      navRight.insertBefore(trigger, navRight.firstChild);
    }
    if (window.location.hash === '#search') openSearch();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
