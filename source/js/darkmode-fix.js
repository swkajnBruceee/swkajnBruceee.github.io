// 修复夜间模式按钮点击问题
(function() {
  'use strict';
  
  console.log('🌙 夜间模式修复脚本启动');
  
  // 等待DOM加载完成
  function initDarkmodeFix() {
    const darkmodeButton = document.getElementById('darkmode');
    
    if (!darkmodeButton) {
      console.warn('❌ 未找到夜间模式按钮');
      return;
    }
    
    console.log('✅ 找到夜间模式按钮');
    
    // 检查是否已有点击事件
    const hasClickEvent = darkmodeButton.onclick || 
                         darkmodeButton.getAttribute('onclick') ||
                         darkmodeButton.hasAttribute('data-click-bound');
    
    if (hasClickEvent) {
      console.log('✅ 夜间模式按钮已有点击事件');
      return;
    }
    
    // 添加点击事件
    darkmodeButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🌙 夜间模式按钮被点击');
      
      // 方法1：使用主题的darkmode函数
      if (typeof anzhiyu !== 'undefined' && typeof anzhiyu.darkmode === 'function') {
        console.log('使用anzhiyu.darkmode函数');
        anzhiyu.darkmode();
        return;
      } else if (typeof btf !== 'undefined' && typeof btf.darkmode === 'function') {
        console.log('使用btf.darkmode函数');
        btf.darkmode();
        return;
      }
      
      // 方法2：手动切换主题
      console.log('手动切换夜间模式');
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      // 切换主题
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // 保存到本地存储
      try {
        if (typeof anzhiyu !== 'undefined' && anzhiyu.saveToLocal) {
          anzhiyu.saveToLocal.set('theme', newTheme, 2);
        } else if (typeof btf !== 'undefined' && btf.saveToLocal) {
          btf.saveToLocal.set('theme', newTheme, 2);
        } else {
          localStorage.setItem('theme', newTheme);
        }
      } catch (error) {
        console.warn('保存主题设置失败:', error);
      }
      
      // 更新主题色
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const themeColor = newTheme === 'dark' ? '#1a202c' : '#ffffff';
        metaThemeColor.setAttribute('content', themeColor);
      }
      
      console.log(`✅ 主题已切换为: ${newTheme}`);
      
      // 显示切换提示（如果有Snackbar）
      if (typeof anzhiyu !== 'undefined' && anzhiyu.snackbarShow) {
        const message = newTheme === 'dark' ? '已切换到夜间模式' : '已切换到日间模式';
        anzhiyu.snackbarShow(message);
      } else if (typeof btf !== 'undefined' && btf.snackbarShow) {
        const message = newTheme === 'dark' ? '已切换到夜间模式' : '已切换到日间模式';
        btf.snackbarShow(message);
      }
    });
    
    // 标记已绑定事件
    darkmodeButton.setAttribute('data-click-bound', 'true');
    console.log('✅ 夜间模式按钮点击事件已绑定');
  }
  
  // 多种初始化时机
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkmodeFix);
  } else {
    initDarkmodeFix();
  }
  
  // 延迟初始化，确保主题脚本已加载
  setTimeout(initDarkmodeFix, 500);
  setTimeout(initDarkmodeFix, 1500);
  
  // 全局函数，供手动调用
  window.toggleDarkMode = function() {
    const darkmodeButton = document.getElementById('darkmode');
    if (darkmodeButton) {
      darkmodeButton.click();
    } else {
      // 直接切换
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    }
  };
  
  console.log('🌙 夜间模式修复脚本加载完成');
  console.log('💡 可以在控制台使用 toggleDarkMode() 手动切换');
})();