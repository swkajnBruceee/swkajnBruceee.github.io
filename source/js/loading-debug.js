// 加载动画调试脚本
(function() {
  'use strict';
  
  // 调试信息
  console.log('🧙‍♂️ 巫师加载动画调试开始');
  
  // 检查加载动画元素
  function checkLoadingElements() {
    const loadingBox = document.getElementById('loading-box');
    const wizardScene = document.querySelector('.wizard-scene');
    const wizard = document.querySelector('.wizard');
    
    console.log('加载框元素:', loadingBox);
    console.log('巫师场景元素:', wizardScene);
    console.log('巫师元素:', wizard);
    
    if (loadingBox) {
      console.log('✅ 找到加载框');
      console.log('加载框样式:', window.getComputedStyle(loadingBox));
    } else {
      console.warn('❌ 未找到加载框');
    }
    
    if (wizardScene) {
      console.log('✅ 找到巫师场景');
    } else {
      console.warn('❌ 未找到巫师场景');
    }
    
    if (wizard) {
      console.log('✅ 找到巫师');
    } else {
      console.warn('❌ 未找到巫师');
    }
  }
  
  // 页面加载完成后检查
  document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM加载完成，检查加载动画元素');
    setTimeout(checkLoadingElements, 100);
  });
  
  // 立即检查（如果DOM已经加载）
  if (document.readyState !== 'loading') {
    console.log('📄 DOM已加载，立即检查加载动画元素');
    checkLoadingElements();
  }
  
  // 监听页面加载事件
  window.addEventListener('load', function() {
    console.log('🚀 页面完全加载完成');
    setTimeout(checkLoadingElements, 100);
  });
  
  // 强制显示加载动画（调试用）
  window.showLoadingDebug = function() {
    const loadingBox = document.getElementById('loading-box');
    if (loadingBox) {
      loadingBox.style.display = 'block';
      loadingBox.classList.remove('loaded');
      console.log('🔧 强制显示加载动画');
    }
  };
  
  // 隐藏加载动画（调试用）
  window.hideLoadingDebug = function() {
    const loadingBox = document.getElementById('loading-box');
    if (loadingBox) {
      loadingBox.classList.add('loaded');
      console.log('🔧 隐藏加载动画');
    }
  };
  
  console.log('🧙‍♂️ 巫师加载动画调试脚本加载完成');
  console.log('💡 可以在控制台使用 showLoadingDebug() 和 hideLoadingDebug() 来测试');
})();