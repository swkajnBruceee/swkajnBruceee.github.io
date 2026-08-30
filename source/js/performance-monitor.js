// 轻量级性能监控
(function() {
  'use strict';
  
  // 只在开发环境或需要时启用
  const ENABLE_MONITORING = false; // 设置为 true 启用监控
  
  if (!ENABLE_MONITORING) return;
  
  let performanceData = {
    pageLoadTime: 0,
    domContentLoadedTime: 0,
    firstPaintTime: 0,
    resourceLoadTime: 0,
    jsExecutionTime: 0
  };
  
  // 监控页面加载性能
  function monitorPageLoad() {
    window.addEventListener('load', function() {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        if (navigation) {
          performanceData.pageLoadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
          performanceData.domContentLoadedTime = Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart);
        }
        
        if (paint.length > 0) {
          const firstPaint = paint.find(entry => entry.name === 'first-paint');
          if (firstPaint) {
            performanceData.firstPaintTime = Math.round(firstPaint.startTime);
          }
        }
        
        // 输出性能数据
        console.group('🚀 页面性能监控');
        console.log('页面加载时间:', performanceData.pageLoadTime + 'ms');
        console.log('DOM加载时间:', performanceData.domContentLoadedTime + 'ms');
        console.log('首次绘制时间:', performanceData.firstPaintTime + 'ms');
        
        // 性能评级
        const rating = getPerformanceRating(performanceData.pageLoadTime);
        console.log('性能评级:', rating.text, rating.emoji);
        console.groupEnd();
        
      }, 100);
    });
  }
  
  // 监控资源加载
  function monitorResourceLoad() {
    window.addEventListener('load', function() {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter(resource => resource.duration > 1000);
        
        if (slowResources.length > 0) {
          console.group('⚠️ 慢速资源');
          slowResources.forEach(resource => {
            console.log(`${resource.name}: ${Math.round(resource.duration)}ms`);
          });
          console.groupEnd();
        }
      }, 500);
    });
  }
  
  // 获取性能评级
  function getPerformanceRating(loadTime) {
    if (loadTime < 1000) {
      return { text: '优秀', emoji: '🟢' };
    } else if (loadTime < 2000) {
      return { text: '良好', emoji: '🟡' };
    } else if (loadTime < 3000) {
      return { text: '一般', emoji: '🟠' };
    } else {
      return { text: '需要优化', emoji: '🔴' };
    }
  }
  
  // 监控内存使用（如果支持）
  function monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        
        if (used > 50) { // 超过50MB时警告
          console.warn(`内存使用较高: ${used}MB / ${total}MB`);
        }
      }, 30000); // 每30秒检查一次
    }
  }
  
  // 初始化监控
  function initMonitoring() {
    monitorPageLoad();
    monitorResourceLoad();
    monitorMemoryUsage();
    
    // 添加性能工具到全局
    window.performanceMonitor = {
      getData: () => performanceData,
      logCurrentPerformance: () => {
        console.table(performanceData);
      }
    };
  }
  
  // 启动监控
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMonitoring);
  } else {
    initMonitoring();
  }
})();