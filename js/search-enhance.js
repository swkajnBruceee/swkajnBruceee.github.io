// 搜索功能增强 - 性能优化版
(function() {
  'use strict';
  
  let searchHistory = [];
  let isInitialized = false;
  
  // 延迟初始化，避免阻塞页面加载
  setTimeout(initSearchEnhance, 1000);
  
  function initSearchEnhance() {
    if (isInitialized) return;
    isInitialized = true;
    
    // 加载搜索历史
    loadSearchHistory();
    
    // 添加键盘快捷键
    addKeyboardShortcuts();
    
    // 监听搜索输入
    enhanceSearchInput();
  }
  
  // 加载搜索历史
  function loadSearchHistory() {
    try {
      const stored = localStorage.getItem('blog-search-history');
      searchHistory = stored ? JSON.parse(stored) : [];
    } catch (e) {
      searchHistory = [];
    }
  }
  
  // 保存搜索历史
  function saveSearchHistory(query) {
    if (!query || query.length < 2) return;
    
    // 移除重复项并添加到开头
    searchHistory = searchHistory.filter(item => item !== query);
    searchHistory.unshift(query);
    
    // 限制历史记录数量
    searchHistory = searchHistory.slice(0, 8);
    
    try {
      localStorage.setItem('blog-search-history', JSON.stringify(searchHistory));
    } catch (e) {
      // 忽略存储错误
    }
  }
  
  // 添加键盘快捷键
  function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Ctrl/Cmd + K 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      
      // ESC 关闭搜索
      if (e.key === 'Escape') {
        closeSearch();
      }
    });
  }
  
  // 增强搜索输入
  function enhanceSearchInput() {
    // 监听导航栏搜索输入
    const navSearchInput = document.getElementById('nav-search-input');
    if (navSearchInput) {
      navSearchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        if (query.length > 1) {
          saveSearchHistory(query);
        }
      });
    }
    
    // 监听主搜索框输入（如果存在）
    const mainSearchInput = document.querySelector('.search-input');
    if (mainSearchInput) {
      mainSearchInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        if (query.length > 1) {
          saveSearchHistory(query);
        }
      });
    }
  }
  
  // 打开搜索
  function openSearch() {
    // 优先使用导航栏搜索
    const navSearchInput = document.getElementById('nav-search-input');
    if (navSearchInput) {
      navSearchInput.focus();
      return;
    }
    
    // 备用：打开主搜索框
    const searchMask = document.getElementById('search-mask');
    const localSearch = document.getElementById('local-search');
    
    if (searchMask && localSearch) {
      searchMask.style.display = 'block';
      localSearch.style.display = 'block';
      
      // 聚焦搜索输入框
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  }
  
  // 关闭搜索
  function closeSearch() {
    // 关闭导航栏搜索结果
    const navSearchResults = document.getElementById('nav-search-results');
    if (navSearchResults) {
      navSearchResults.classList.remove('show');
    }
    
    // 关闭主搜索框
    const searchMask = document.getElementById('search-mask');
    const localSearch = document.getElementById('local-search');
    
    if (searchMask && localSearch) {
      searchMask.style.display = 'none';
      localSearch.style.display = 'none';
    }
  }
  
  // 获取搜索建议
  function getSearchSuggestions(query) {
    const suggestions = [];
    
    // 从历史记录中获取建议
    searchHistory.forEach(item => {
      if (item.toLowerCase().includes(query.toLowerCase()) && item !== query) {
        suggestions.push(item);
      }
    });
    
    // 添加一些常用搜索词
    const commonTerms = [
      'JavaScript', 'Python', 'React', 'Vue', 'HTML', 'CSS',
      '算法', '数据结构', '前端', '后端', '教程'
    ];
    
    commonTerms.forEach(term => {
      if (term.toLowerCase().includes(query.toLowerCase()) && 
          !suggestions.includes(term) && 
          suggestions.length < 5) {
        suggestions.push(term);
      }
    });
    
    return suggestions.slice(0, 5);
  }
  
  // 全局函数，供其他脚本调用
  window.searchEnhance = {
    openSearch: openSearch,
    closeSearch: closeSearch,
    getHistory: () => searchHistory,
    getSuggestions: getSearchSuggestions
  };
})();