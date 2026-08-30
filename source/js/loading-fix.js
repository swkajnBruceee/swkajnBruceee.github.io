// 修复巫师加载动画显示时间和隐藏问题
(function() {
  'use strict';
  
  console.log('🧙‍♂️ 巫师加载动画修复脚本启动');
  
  let loadingStartTime = Date.now();
  let isLoadingHidden = false;
  
  // 智能隐藏加载动画
  function smartHideLoading() {
    if (isLoadingHidden) return;
    
    const loadingBox = document.getElementById('loading-box');
    if (!loadingBox) return;
    
    const currentTime = Date.now();
    const elapsedTime = currentTime - loadingStartTime;
    const minDisplayTime = 2500; // 最少显示2.5秒
    
    console.log(`⏱️ 加载动画已显示 ${elapsedTime}ms`);
    
    if (elapsedTime < minDisplayTime) {
      // 如果显示时间不足，延迟隐藏
      const remainingTime = minDisplayTime - elapsedTime;
      console.log(`⏳ 延迟 ${remainingTime}ms 后隐藏加载动画`);
      
      setTimeout(() => {
        hideLoadingAnimation();
      }, remainingTime);
    } else {
      // 时间足够，立即隐藏
      hideLoadingAnimation();
    }
  }
  
  // 隐藏加载动画
  function hideLoadingAnimation() {
    if (isLoadingHidden) return;
    
    const loadingBox = document.getElementById('loading-box');
    if (!loadingBox) return;
    
    console.log('🎭 开始隐藏巫师加载动画');
    
    // 标记为已隐藏
    isLoadingHidden = true;
    
    // 添加loaded类，触发主题的隐藏动画
    loadingBox.classList.add('loaded');
    
    // 确保页面可以正常滚动
    document.body.style.overflow = 'auto';
    
    // 延迟完全隐藏，让过渡动画完成
    setTimeout(() => {
      if (loadingBox) {
        loadingBox.style.zIndex = '-1000';
        loadingBox.style.pointerEvents = 'none';
      }
      console.log('✅ 巫师加载动画已完全隐藏');
    }, 1000);
  }
  
  // 检查是否需要立即隐藏（页面已经加载完成）
  function checkImmediateHide() {
    if (document.readyState === 'complete') {
      console.log('📄 页面已完全加载，准备隐藏加载动画');
      smartHideLoading();
    }
  }
  
  // 页面加载完成事件
  window.addEventListener('load', function() {
    console.log('🚀 页面加载完成事件触发');
    smartHideLoading();
  });
  
  // 立即检查页面状态
  checkImmediateHide();
  
  // 超时保护，最多显示8秒
  setTimeout(function() {
    if (!isLoadingHidden) {
      console.log('⏰ 超时保护：强制隐藏加载动画');
      hideLoadingAnimation();
    }
  }, 8000);
  
  // 全局函数，供调试使用
  window.hideLoadingNow = function() {
    console.log('🔧 手动隐藏加载动画');
    hideLoadingAnimation();
  };
  
  window.showLoadingInfo = function() {
    const loadingBox = document.getElementById('loading-box');
    console.log('📊 加载动画状态:', {
      element: loadingBox,
      isHidden: isLoadingHidden,
      elapsedTime: Date.now() - loadingStartTime,
      hasLoadedClass: loadingBox?.classList.contains('loaded')
    });
  };
  
  console.log('🧙‍♂️ 巫师加载动画修复脚本加载完成');
  console.log('💡 可以使用 showLoadingInfo() 查看状态，hideLoadingNow() 立即隐藏');
})();