// 调试Waline输入框placeholder
console.log('开始调试Waline输入框...');

// 等待Waline加载完成
setTimeout(() => {
  const inputs = document.querySelectorAll('.wl-input');
  console.log('找到的输入框数量:', inputs.length);
  
  inputs.forEach((input, index) => {
    console.log(`输入框 ${index + 1}:`);
    console.log('- placeholder:', input.placeholder);
    console.log('- type:', input.type);
    console.log('- 元素:', input);
  });
  
  // 检查CSS样式
  const style = getComputedStyle(document.querySelector('.wl-input'));
  console.log('CSS before content:', style.getPropertyValue('--before-content'));
}, 3000);

// 监听输入框焦点事件
document.addEventListener('focusin', (e) => {
  if (e.target.classList.contains('wl-input')) {
    console.log('输入框获得焦点:', e.target.placeholder);
  }
});