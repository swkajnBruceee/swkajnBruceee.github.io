// 轻量级导航栏搜索功能
(function() {
  'use strict';
  
  let searchData = [];
  let isDataLoaded = false;
  let searchTimeout = null;
  
  // 初始化搜索功能
  function initSearch() {
    const searchInput = document.getElementById('nav-search-input');
    const searchResults = document.getElementById('nav-search-results');
    
    if (!searchInput || !searchResults) return;
    
    // 绑定事件
    searchInput.addEventListener('input', handleInput);
    searchInput.addEventListener('focus', handleFocus);
    searchInput.addEventListener('keydown', handleKeydown);
    
    // 点击外部关闭结果
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.nav-search-container')) {
        hideResults();
      }
    });
    
    // 加载搜索数据
    loadSearchData();
  }
  
  // 处理输入事件
  function handleInput(e) {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    searchTimeout = setTimeout(() => {
      if (query.length > 0) {
        performSearch(query);
      } else {
        hideResults();
      }
    }, 200);
  }
  
  // 处理焦点事件
  function handleFocus() {
    const query = this.value.trim();
    if (query) {
      performSearch(query);
    }
  }
  
  // 处理键盘事件
  function handleKeydown(e) {
    if (e.key === 'Escape') {
      hideResults();
      this.blur();
    }
  }
  
  // 加载搜索数据
  async function loadSearchData() {
    try {
      const response = await fetch('/search.xml');
      if (!response.ok) throw new Error('Failed to fetch search data');
      
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const entries = xmlDoc.querySelectorAll('entry');
      searchData = Array.from(entries).map(entry => ({
        title: entry.querySelector('title')?.textContent || '',
        content: entry.querySelector('content')?.textContent?.replace(/<[^>]+>/g, '') || '',
        url: entry.querySelector('url')?.textContent || ''
      }));
      
      isDataLoaded = true;
    } catch (error) {
      console.warn('Search data loading failed:', error);
    }
  }
  
  // 执行搜索
  function performSearch(query) {
    if (!isDataLoaded) {
      showResults([], query);
      return;
    }
    
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    const results = [];
    
    for (let i = 0; i < searchData.length && results.length < 6; i++) {
      const item = searchData[i];
      const titleLower = item.title.toLowerCase();
      const contentLower = item.content.toLowerCase();
      
      let score = 0;
      
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) score += 10;
        if (contentLower.includes(keyword)) score += 1;
      }
      
      if (score > 0) {
        results.push({ ...item, score });
      }
    }
    
    results.sort((a, b) => b.score - a.score);
    showResults(results, query);
  }
  
  // 显示搜索结果
  function showResults(results, query = '') {
    const searchResults = document.getElementById('nav-search-results');
    if (!searchResults) return;
    
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="nav-search-empty">
          ${query ? `未找到包含 "${query}" 的文章` : '开始输入以搜索文章...'}
        </div>
      `;
    } else {
      searchResults.innerHTML = results.map(result => `
        <div class="nav-search-item" onclick="location.href='${result.url}'">
          <div class="nav-search-title">${highlightText(result.title, query)}</div>
          <div class="nav-search-content">${highlightText(truncateText(result.content, 80), query)}</div>
        </div>
      `).join('');
    }
    
    searchResults.classList.add('show');
  }
  
  // 隐藏搜索结果
  function hideResults() {
    const searchResults = document.getElementById('nav-search-results');
    if (searchResults) {
      searchResults.classList.remove('show');
    }
  }
  
  // 高亮文本
  function highlightText(text, query) {
    if (!query) return text;
    
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    let result = text;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, '<span class="nav-search-highlight">$1</span>');
    });
    
    return result;
  }
  
  // 截断文本
  function truncateText(text, maxLength) {
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
  }
  
  // 键盘快捷键
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('nav-search-input');
      if (searchInput) searchInput.focus();
    }
  });
  
  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
})();