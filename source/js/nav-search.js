// 按需加载本地索引；弹窗、键盘操作和 PJAX 共用同一份状态。
(function () {
  'use strict';

  let dataPromise;
  let searchData;
  let loadError = false;
  let previousOverflow = '';
  let returnFocus;
  let inputTimer;
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  function plainText(html) {
    const template = document.createElement('template');
    template.innerHTML = html.replace(/<\/(?:p|div|h[1-6]|li|pre|tr)>/gi, '$& ');
    template.content.querySelectorAll('script, style').forEach(node => node.remove());
    return template.content.textContent.replace(/\s+/g, ' ').trim();
  }

  function localUrl(value) {
    try {
      const url = new URL(value, location.origin);
      const siteOrigin = new URL(document.querySelector('link[rel="canonical"]').href).origin;
      if (!['http:', 'https:'].includes(url.protocol) || ![location.origin, siteOrigin].includes(url.origin)) return null;
      return url.pathname + url.search + url.hash;
    } catch { return null; }
  }

  async function loadData() {
    if (dataPromise) return dataPromise;
    loadError = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    dataPromise = fetch('/search.xml', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`搜索索引 HTTP ${response.status}`);
        return response.text();
      })
      .then(text => {
        const xml = new DOMParser().parseFromString(text, 'text/xml');
        if (xml.querySelector('parsererror')) throw new Error('搜索索引格式无效');
        searchData = [...xml.querySelectorAll('entry')].map(entry => {
          const title = entry.querySelector('title')?.textContent || '';
          const content = plainText(entry.querySelector('content')?.textContent || '');
          return { title, content, titleLower: title.toLowerCase(), contentLower: content.toLowerCase(), url: localUrl(entry.querySelector('url')?.textContent || '') };
        }).filter(item => item.url);
      })
      .catch(() => {
        loadError = true;
        dataPromise = undefined; // 下次打开或点击重试时重新请求。
      })
      .finally(() => clearTimeout(timeout));
    return dataPromise;
  }

  function highlight(text, terms) {
    const pattern = new RegExp(terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
    let result = '';
    let offset = 0;
    for (const match of text.matchAll(pattern)) {
      result += escapeHtml(text.slice(offset, match.index)) + '<mark>' + escapeHtml(match[0]) + '</mark>';
      offset = match.index + match[0].length;
    }
    return result + escapeHtml(text.slice(offset));
  }

  function renderResults() {
    const container = document.getElementById('blog-search-results');
    const status = document.getElementById('blog-search-status');
    const query = document.getElementById('blog-search-input').value.trim();
    container.replaceChildren();
    if (loadError) {
      status.textContent = '搜索数据加载失败，请检查网络后重试。';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '重新加载';
      button.addEventListener('click', async () => { const pending = loadData(); renderResults(); await pending; renderResults(); });
      container.appendChild(button);
      return;
    }
    if (!searchData) { status.textContent = '正在加载搜索数据…'; return; }
    if (!query) { status.textContent = '输入关键词搜索文章，支持用空格分隔多个关键词。'; return; }
    const terms = [...new Set(query.toLowerCase().split(/\s+/))].sort((a, b) => b.length - a.length);
    const results = searchData.map(item => {
      const haystack = `${item.titleLower} ${item.contentLower}`;
      if (!terms.every(term => haystack.includes(term))) return null;
      const score = terms.reduce((n, term) => n + (item.titleLower.includes(term) ? 10 : 0) + (item.contentLower.includes(term) ? 1 : 0), 0);
      return { ...item, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    status.textContent = results.length ? `找到 ${results.length} 篇文章${results.length > 20 ? '，显示前 20 篇' : ''}` : `未找到包含“${query}”的文章`;
    container.innerHTML = results.slice(0, 20).map(item => {
      const hits = terms.map(term => item.contentLower.indexOf(term)).filter(index => index >= 0);
      const start = hits.length ? Math.max(0, Math.min(...hits) - 40) : 0;
      const snippet = (start ? '…' : '') + item.content.slice(start, start + 160) + (item.content.length > start + 160 ? '…' : '');
      return `<a class="blog-search-item" href="${escapeHtml(item.url)}"><div class="blog-search-title">${highlight(item.title, terms)}</div><div class="blog-search-content">${highlight(snippet, terms)}</div></a>`;
    }).join('');
  }

  function closeSearch() {
    document.getElementById('blog-search-modal')?.close();
  }

  function openSearch() {
    const modal = document.getElementById('blog-search-modal');
    if (!modal.open) {
      returnFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      modal.showModal();
      document.body.style.overflow = 'hidden';
    }
    const pending = loadData();
    renderResults();
    pending.then(() => { if (modal.open) renderResults(); });
    document.getElementById('blog-search-input').focus();
  }

  function init() {
    const modal = document.createElement('dialog');
    modal.id = 'blog-search-modal';
    modal.setAttribute('aria-label', '站内搜索');
    modal.innerHTML = `<div class="blog-search-head"><input id="blog-search-input" type="search" aria-label="搜索文章标题或内容" placeholder="搜索文章标题或内容" autocomplete="off"><button class="blog-search-close" type="button" aria-label="关闭搜索">×</button></div><p id="blog-search-status" role="status" aria-live="polite"></p><div id="blog-search-results" class="blog-search-results"></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
    modal.addEventListener('click', event => {
      const rect = modal.getBoundingClientRect();
      if (event.target.closest('.blog-search-close') || (event.target === modal && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom))) closeSearch();
      const result = event.target.closest('.blog-search-item');
      if (result && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        closeSearch();
        window.pjax ? window.pjax.loadUrl(result.getAttribute('href')) : location.assign(result.href);
      }
    });
    const input = modal.querySelector('input');
    input.addEventListener('input', () => {
      clearTimeout(inputTimer);
      inputTimer = setTimeout(renderResults, 100);
    });
    modal.addEventListener('keydown', event => {
      const results = [...modal.querySelectorAll('.blog-search-item')];
      const index = results.indexOf(document.activeElement);
      if (event.key === 'Tab') {
        const controls = [...modal.querySelectorAll('input, button, a[href]')].filter(element => !element.disabled);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length) {
        event.preventDefault();
        const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
        (next < 0 || next >= results.length ? input : results[next]).focus();
      } else if (event.key === 'Enter' && event.target === input && results.length) {
        event.preventDefault();
        results[0].click();
      }
    });
    document.addEventListener('click', event => {
      if (event.target.closest('#menu-search, #search-button, .blog-search-trigger, a[href="#search"]')) {
        event.preventDefault();
        openSearch();
      }
    });
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
      }
    });
    document.addEventListener('pjax:send', closeSearch);
    const openFromHash = () => { if (location.hash === '#search') openSearch(); };
    document.addEventListener('pjax:complete', openFromHash);
    window.addEventListener('hashchange', openFromHash);
    openFromHash();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
