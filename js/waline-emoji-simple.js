/**
 * Waline简单表情按钮实现
 * 直接为Waline评论系统添加表情按钮功能
 */

(function() {
    'use strict';
    
    // 基础表情数据
    const EMOJI_DATA = {
        '常用': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩'],
        '情感': ['😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨'],
        '表情': ['😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢'],
        '动作': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦵']
    };
    
    let isInitialized = false;
    
    // 等待Waline加载
    function waitForWaline() {
        const walineContainer = document.querySelector('#waline');
        if (walineContainer && !isInitialized) {
            console.log('🎭 检测到Waline容器，开始初始化表情按钮...');
            initEmojiButton();
        } else if (!isInitialized) {
            setTimeout(waitForWaline, 500);
        }
    }
    
    // 初始化表情按钮
    function initEmojiButton() {
        const checkInterval = setInterval(() => {
            const actionBar = document.querySelector('#waline .wl-action');
            const editor = document.querySelector('#waline .wl-editor');
            
            if (actionBar && editor && !actionBar.querySelector('.emoji-btn-container')) {
                clearInterval(checkInterval);
                createEmojiButton(actionBar, editor);
                isInitialized = true;
                console.log('✅ 表情按钮初始化成功');
            }
        }, 200);
        
        // 10秒后停止检查
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
    
    // 创建表情按钮
    function createEmojiButton(actionBar, editor) {
        // 创建按钮容器
        const container = document.createElement('div');
        container.className = 'emoji-btn-container';
        container.style.cssText = `
            position: relative;
            display: inline-block;
            margin-right: 8px;
        `;
        
        // 创建表情按钮
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'emoji-btn';
        button.innerHTML = '😀';
        button.title = '选择表情';
        button.style.cssText = `
            background: var(--waline-bg-color, #fff);
            border: 1px solid var(--waline-border-color, #ddd);
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: var(--waline-text-color, #333);
        `;
        
        // 创建表情面板
        const panel = document.createElement('div');
        panel.className = 'emoji-panel';
        panel.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 0;
            background: var(--waline-bg-color, #fff);
            border: 1px solid var(--waline-border-color, #ddd);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 12px;
            display: none;
            z-index: 1000;
            width: 300px;
            max-height: 200px;
            overflow-y: auto;
        `;
        
        // 添加表情内容
        createEmojiContent(panel, editor);
        
        // 组装元素
        container.appendChild(button);
        container.appendChild(panel);
        actionBar.insertBefore(container, actionBar.firstChild);
        
        // 添加事件
        addEvents(button, panel, editor);
    }
    
    // 创建表情内容
    function createEmojiContent(panel, editor) {
        Object.entries(EMOJI_DATA).forEach(([category, emojis]) => {
            // 分类标题
            const title = document.createElement('div');
            title.textContent = category;
            title.style.cssText = `
                font-size: 12px;
                color: #666;
                margin: 8px 0 4px 0;
                font-weight: bold;
            `;
            panel.appendChild(title);
            
            // 表情网格
            const grid = document.createElement('div');
            grid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(8, 1fr);
                gap: 4px;
                margin-bottom: 8px;
            `;
            
            emojis.forEach(emoji => {
                const item = document.createElement('span');
                item.textContent = emoji;
                item.style.cssText = `
                    font-size: 18px;
                    padding: 4px;
                    cursor: pointer;
                    border-radius: 4px;
                    text-align: center;
                    transition: background-color 0.2s ease;
                    user-select: none;
                `;
                
                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = '#f0f0f0';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'transparent';
                });
                
                item.addEventListener('click', () => {
                    insertEmoji(editor, emoji);
                    panel.style.display = 'none';
                });
                
                grid.appendChild(item);
            });
            
            panel.appendChild(grid);
        });
    }
    
    // 添加事件监听
    function addEvents(button, panel, editor) {
        // 按钮点击
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isVisible = panel.style.display === 'block';
            
            // 隐藏其他面板
            document.querySelectorAll('.emoji-panel').forEach(p => {
                if (p !== panel) p.style.display = 'none';
            });
            
            panel.style.display = isVisible ? 'none' : 'block';
        });
        
        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!button.contains(e.target) && !panel.contains(e.target)) {
                panel.style.display = 'none';
            }
        });
        
        // ESC关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                panel.style.display = 'none';
            }
        });
        
        // 按钮悬停效果
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#f0f0f0';
            button.style.borderColor = '#999';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'var(--waline-bg-color, #fff)';
            button.style.borderColor = 'var(--waline-border-color, #ddd)';
        });
    }
    
    // 插入表情
    function insertEmoji(editor, emoji) {
        if (!editor) return;
        
        const start = editor.selectionStart || 0;
        const end = editor.selectionEnd || 0;
        const value = editor.value || '';
        
        const newValue = value.slice(0, start) + emoji + value.slice(end);
        editor.value = newValue;
        
        // 设置光标位置
        const newPos = start + emoji.length;
        editor.setSelectionRange(newPos, newPos);
        
        // 触发事件
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.focus();
        
        console.log('✅ 插入表情:', emoji);
    }
    
    // 监听DOM变化
    function observeChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && 
                            (node.id === 'waline' || 
                             node.querySelector && node.querySelector('#waline'))) {
                            isInitialized = false;
                            setTimeout(waitForWaline, 500);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // 初始化
    function init() {
        console.log('🎭 Waline简单表情按钮脚本已加载');
        waitForWaline();
        observeChanges();
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 窗口加载完成后再次尝试
    window.addEventListener('load', () => {
        setTimeout(waitForWaline, 1000);
    });
    
    // PJAX支持
    if (window.addEventListener) {
        window.addEventListener('pjax:complete', () => {
            isInitialized = false;
            setTimeout(waitForWaline, 1000);
        });
    }
    
})();