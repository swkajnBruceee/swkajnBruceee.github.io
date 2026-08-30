/**
 * Waline表情按钮初始化脚本
 * 专门用于修复Waline评论系统中缺失的表情按钮问题
 */

(function() {
    'use strict';
    
    // 等待Waline加载完成
    function waitForWaline() {
        // 检查Waline是否已加载
        const walineContainer = document.querySelector('#waline') || 
                               document.querySelector('.waline-container') ||
                               document.querySelector('[class*="waline"]');
        
        if (walineContainer && window.Waline) {
            console.log('🎭 Waline已加载，开始初始化表情按钮...');
            initEmojiButton();
        } else {
            // 如果Waline还没加载，等待一段时间后重试
            setTimeout(waitForWaline, 500);
        }
    }
    
    // 初始化表情按钮
    function initEmojiButton() {
        // 查找评论输入区域
        const walineContainer = document.querySelector('#waline');
        if (!walineContainer) {
            console.log('未找到Waline容器，1秒后重试...');
            setTimeout(initEmojiButton, 1000);
            return;
        }
        
        // 等待Waline完全渲染
        const checkWalineReady = setInterval(() => {
            const inputArea = walineContainer.querySelector('.wl-editor');
            const actionArea = walineContainer.querySelector('.wl-action');
            
            if (inputArea && actionArea) {
                clearInterval(checkWalineReady);
                console.log('✅ Waline输入区域已就绪');
                
                // 检查是否已经有表情按钮
                let emojiButton = actionArea.querySelector('.wl-emoji');
                
                if (!emojiButton) {
                    console.log('🔧 创建表情按钮...');
                    createEmojiButton(actionArea, inputArea);
                } else {
                    console.log('✅ 表情按钮已存在');
                    enhanceExistingButton(emojiButton, inputArea);
                }
            }
        }, 100);
        
        // 10秒后停止检查
        setTimeout(() => {
            clearInterval(checkWalineReady);
        }, 10000);
    }
    
    // 创建表情按钮
    function createEmojiButton(actionArea, inputArea) {
        // 创建表情按钮容器
        const emojiContainer = document.createElement('div');
        emojiContainer.className = 'wl-emoji';
        emojiContainer.style.cssText = `
            position: relative;
            display: inline-block;
            margin-right: 8px;
            order: -1;
        `;
        
        // 创建表情按钮
        const emojiButton = document.createElement('button');
        emojiButton.type = 'button';
        emojiButton.className = 'wl-emoji-btn';
        emojiButton.innerHTML = '😀';
        emojiButton.title = '插入表情';
        emojiButton.style.cssText = `
            background: none;
            border: none;
            font-size: 1.2em;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.3s ease;
            color: var(--waline-theme-color, #27ae60);
        `;
        
        // 创建表情面板
        const emojiPanel = document.createElement('div');
        emojiPanel.className = 'wl-emoji-panel';
        emojiPanel.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 0;
            background: var(--waline-bg-color, #fff);
            border: 1px solid var(--waline-border-color, #ddd);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            padding: 12px;
            display: none;
            z-index: 1000;
            min-width: 300px;
            max-height: 200px;
            overflow-y: auto;
        `;
        
        // 添加表情内容
        addEmojiContent(emojiPanel, inputArea);
        
        // 组装元素
        emojiContainer.appendChild(emojiButton);
        emojiContainer.appendChild(emojiPanel);
        
        // 插入到操作区域的开头
        actionArea.insertBefore(emojiContainer, actionArea.firstChild);
        
        // 添加事件监听
        addEmojiEvents(emojiButton, emojiPanel, inputArea);
        
        console.log('✅ 表情按钮创建成功');
    }
    
    // 增强现有按钮
    function enhanceExistingButton(emojiButton, inputArea) {
        // 如果现有按钮没有内容，添加表情面板
        let panel = emojiButton.querySelector('.wl-emoji-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'wl-emoji-panel';
            panel.style.cssText = `
                position: absolute;
                bottom: 100%;
                left: 0;
                background: var(--waline-bg-color, #fff);
                border: 1px solid var(--waline-border-color, #ddd);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                padding: 12px;
                display: none;
                z-index: 1000;
                min-width: 300px;
                max-height: 200px;
                overflow-y: auto;
            `;
            
            addEmojiContent(panel, inputArea);
            emojiButton.appendChild(panel);
            
            const button = emojiButton.querySelector('button') || emojiButton;
            addEmojiEvents(button, panel, inputArea);
        }
    }
    
    // 添加表情内容
    function addEmojiContent(panel, inputArea) {
        // 基础表情
        const basicEmojis = [
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
            '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
            '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
            '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
            '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
            '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
            '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠',
            '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️',
            '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
            '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
            '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬'
        ];
        
        // 创建表情网格
        const emojiGrid = document.createElement('div');
        emojiGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 4px;
        `;
        
        basicEmojis.forEach(emoji => {
            const emojiItem = document.createElement('span');
            emojiItem.textContent = emoji;
            emojiItem.className = 'emoji-item';
            emojiItem.style.cssText = `
                font-size: 1.2em;
                padding: 4px;
                cursor: pointer;
                border-radius: 4px;
                text-align: center;
                transition: all 0.2s ease;
                user-select: none;
            `;
            
            // 添加悬停效果
            emojiItem.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'var(--waline-theme-color-light, #e8f5e8)';
                this.style.transform = 'scale(1.2)';
            });
            
            emojiItem.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
                this.style.transform = 'scale(1)';
            });
            
            // 添加点击事件
            emojiItem.addEventListener('click', function() {
                insertEmoji(inputArea, emoji);
                panel.style.display = 'none';
            });
            
            emojiGrid.appendChild(emojiItem);
        });
        
        panel.appendChild(emojiGrid);
    }
    
    // 添加表情事件
    function addEmojiEvents(button, panel, inputArea) {
        // 按钮点击事件
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isVisible = panel.style.display === 'block';
            
            // 隐藏所有其他表情面板
            document.querySelectorAll('.wl-emoji-panel').forEach(p => {
                if (p !== panel) p.style.display = 'none';
            });
            
            // 切换当前面板
            panel.style.display = isVisible ? 'none' : 'block';
        });
        
        // 点击外部关闭面板
        document.addEventListener('click', function(e) {
            if (!button.contains(e.target) && !panel.contains(e.target)) {
                panel.style.display = 'none';
            }
        });
        
        // ESC键关闭面板
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                panel.style.display = 'none';
            }
        });
    }
    
    // 插入表情到输入框
    function insertEmoji(inputArea, emoji) {
        if (inputArea) {
            const currentValue = inputArea.value || '';
            const cursorPos = inputArea.selectionStart || currentValue.length;
            
            const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
            inputArea.value = newValue;
            
            // 设置光标位置
            const newCursorPos = cursorPos + emoji.length;
            inputArea.setSelectionRange(newCursorPos, newCursorPos);
            
            // 触发输入事件
            inputArea.dispatchEvent(new Event('input', { bubbles: true }));
            inputArea.focus();
            
            console.log('✅ 表情插入成功:', emoji);
        }
    }
    
    // 监听DOM变化，处理动态加载的评论区
    function observeWalineChanges() {
        const observer = new MutationObserver(function(mutations) {
            let shouldInit = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // 元素节点
                            // 检查是否是新的Waline容器
                            if (node.id === 'waline' || 
                                node.classList.contains('waline-container') ||
                                node.querySelector && node.querySelector('#waline')) {
                                shouldInit = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldInit) {
                setTimeout(initEmojiButton, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // 页面加载完成后开始初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            waitForWaline();
            observeWalineChanges();
        });
    } else {
        waitForWaline();
        observeWalineChanges();
    }
    
    // 也在窗口加载完成后再次尝试
    window.addEventListener('load', function() {
        setTimeout(waitForWaline, 1000);
    });
    
    // 支持PJAX
    if (window.addEventListener) {
        window.addEventListener('pjax:complete', function() {
            setTimeout(waitForWaline, 1000);
        });
    }
    
    console.log('🎭 Waline表情按钮初始化脚本已加载');
    
})();