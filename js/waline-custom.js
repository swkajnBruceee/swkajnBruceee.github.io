// 自定义Waline评论系统的JavaScript功能

// 添加全局刷新函数，防止window.refreshFn未定义错误
if (typeof window.refreshFn !== 'function') {
  window.refreshFn = function() {
    console.log('Waline custom refresh function called');
    fixCommentLayout();
  };
}

// 使用DOMContentLoaded事件确保页面DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  // 等待Waline加载完成
  var checkInterval = setInterval(function() {
    var editor = document.querySelector('.wl-editor');
    if (editor) {
      clearInterval(checkInterval);
      addEditorInfoTip(editor);
      
      // 监听评论区变化，修复评论布局
      setupCommentLayoutObserver();
    }
  }, 500);
});

// 设置评论区DOM变化观察器
function setupCommentLayoutObserver() {
  // 创建一个观察器实例
  var observer = new MutationObserver(function(mutations) {
    fixCommentLayout();
  });
  
  // 获取评论容器
  var commentContainer = document.querySelector('.waline-container');
  if (commentContainer) {
    // 配置观察选项
    var config = { childList: true, subtree: true };
    // 开始观察
    observer.observe(commentContainer, config);
    // 立即修复当前布局
    fixCommentLayout();
  }
}

// 修复评论布局，确保回复评论显示在主评论下方
function fixCommentLayout() {
  // 获取所有评论卡片
  var cards = document.querySelectorAll('.wl-card');
  
  cards.forEach(function(card) {
    // 获取子评论容器
    var childrenContainer = card.querySelector('.wl-children');
    if (childrenContainer) {
      // 将子评论容器移动到卡片的最后
      card.appendChild(childrenContainer);
      
      // 确保子评论容器在所有内容之后显示
      childrenContainer.style.order = '999';
      childrenContainer.style.marginTop = '1rem';
      childrenContainer.style.width = '100%';
      childrenContainer.style.display = 'flex';
      childrenContainer.style.flexDirection = 'column';
    }
    
    // 获取评论内容区域
    var content = card.querySelector('.wl-content');
    if (content) {
      content.style.order = '1';
    }
    
    // 获取评论元数据区域
    var meta = card.querySelector('.wl-meta');
    if (meta) {
      meta.style.order = '2';
    }
    
    // 获取评论操作区域
    var action = card.querySelector('.wl-action');
    if (action) {
      action.style.order = '3';
    }
  });
}

// 添加评论输入提示气泡
function addEditorInfoTip(editor) {
  var editorWrapper = editor.parentElement;
  
  // 创建提示气泡元素
  var infoTip = document.createElement('div');
  infoTip.className = 'wl-editor-info';
  infoTip.textContent = '输入评论内容...';
  editorWrapper.style.position = 'relative';
  editorWrapper.appendChild(infoTip);
  
  // 编辑器获得焦点时显示气泡
  editor.addEventListener('focus', function() {
    infoTip.classList.add('active');
    infoTip.textContent = '支持Markdown格式~';
  });
  
  // 编辑器失去焦点时隐藏气泡
  editor.addEventListener('blur', function() {
    infoTip.classList.remove('active');
  });
  
  // 根据输入内容更新气泡提示
  editor.addEventListener('input', function() {
    if (editor.value.length > 0) {
      infoTip.textContent = '写得不错，继续加油！';
    } else {
      infoTip.textContent = '支持Markdown格式~';
    }
  });
}