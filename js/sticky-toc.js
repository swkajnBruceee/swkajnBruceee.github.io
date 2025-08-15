// 目录和最近发布模块粘性滚动功能 - 正确的粘性行为
(function() {
  'use strict';
  
  let stickyLayout, articleContainer, asideContent;
  let originalLayoutTop = 0;
  let isSticky = false;
  let originalWidth = 0;
  let originalLeft = 0;
  
  // 初始化函数
  function initStickyToc() {
    stickyLayout = document.querySelector('.sticky_layout');
    articleContainer = document.querySelector('#article-container');
    asideContent = document.querySelector('#aside-content');
    
    if (!stickyLayout || !articleContainer || !asideContent) {
      return;
    }
    
    // 重置状态
    resetStickyState();
    
    // 获取sticky_layout容器的原始位置和尺寸
    const layoutRect = stickyLayout.getBoundingClientRect();
    originalLayoutTop = layoutRect.top + window.pageYOffset;
    originalWidth = stickyLayout.offsetWidth;
    originalLeft = layoutRect.left;
    
    // 添加滚动监听
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
  
  // 重置状态
  function resetStickyState() {
    if (!stickyLayout) return;
    
    isSticky = false;
    stickyLayout.style.position = '';
    stickyLayout.style.top = '';
    stickyLayout.style.left = '';
    stickyLayout.style.width = '';
    stickyLayout.style.zIndex = '';
    stickyLayout.style.transition = '';
  }
  
  // 处理滚动事件
  function handleScroll() {
    if (!stickyLayout || !articleContainer) return;
    
    const scrollY = window.pageYOffset;
    const layoutRect = stickyLayout.getBoundingClientRect();
    const articleRect = articleContainer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // 检查是否到达文章最后一章节（文章底部）
    const isAtArticleEnd = articleRect.bottom <= viewportHeight + 50;
    
    if (!isSticky) {
      // 未激活状态：检查是否需要激活粘性模式
      const shouldBeSticky = layoutRect.top <= 20;
      if (shouldBeSticky && !isAtArticleEnd) {
        activateStickyMode();
      }
    } else {
      // 已激活状态：检查是否需要取消粘性模式
      if (isAtArticleEnd) {
        // 到达文章底部时取消固定，让模块跟随文章滚动
        deactivateStickyMode();
      } else if (scrollY < originalLayoutTop - 100) {
        // 向上滚动超过原始位置较多时取消固定，让模块自然回到文档流
        deactivateStickyMode();
      }
    }
  }
  
  // 激活粘性模式
  function activateStickyMode() {
    if (!stickyLayout || isSticky) return;
    
    isSticky = true;
    
    // 设置固定定位 - 整个sticky_layout容器（包含TOC和最近发布模块）
    stickyLayout.style.transition = 'none';
    stickyLayout.style.position = 'fixed';
    stickyLayout.style.top = '20px';
    stickyLayout.style.left = originalLeft + 'px';
    stickyLayout.style.width = originalWidth + 'px';
    stickyLayout.style.zIndex = '100';
    stickyLayout.style.opacity = '0.8';
    
    // 添加平滑淡入效果
    setTimeout(() => {
      if (isSticky) { // 确保仍处于粘性状态
        stickyLayout.style.transition = 'opacity 0.3s ease';
        stickyLayout.style.opacity = '1';
      }
    }, 50);
  }
  
  // 取消粘性模式
  function deactivateStickyMode() {
    if (!stickyLayout || !isSticky) return;
    
    isSticky = false;
    
    // 添加平滑过渡效果
    stickyLayout.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    stickyLayout.style.opacity = '0.7';
    
    // 延迟恢复原始样式，确保过渡效果完成
    setTimeout(() => {
      if (!isSticky) { // 确保在延迟期间没有重新激活
        stickyLayout.style.transition = 'none';
        stickyLayout.style.position = '';
        stickyLayout.style.top = '';
        stickyLayout.style.left = '';
        stickyLayout.style.width = '';
        stickyLayout.style.zIndex = '';
        stickyLayout.style.opacity = '1'; // 恢复完全不透明
      }
    }, 300);
  }
  

  
  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStickyToc);
  } else {
    initStickyToc();
  }
  
  // PJAX支持
  if (typeof pjax !== 'undefined') {
    document.addEventListener('pjax:complete', function() {
      // 清理旧的监听器和状态
      if (stickyLayout) {
        resetStickyState();
      }
      // 重新初始化
      setTimeout(initStickyToc, 100);
    });
  }
  
  // 窗口大小改变时重新初始化
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (stickyLayout) {
        resetStickyState();
        setTimeout(initStickyToc, 100);
      }
    }, 250);
  });
})();