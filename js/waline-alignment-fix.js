/* Waline 评论区垂直对齐修复 - JavaScript 解决方案 */
/* 当CSS无法解决时，使用JavaScript动态修复对齐问题 */

(function() {
    'use strict';
    
    // 等待页面加载完成
    function waitForWaline() {
        // 检查Waline是否已加载
        const walineContainer = document.querySelector('.waline-container') || 
                               document.querySelector('[class*="waline"]') ||
                               document.querySelector('#waline');
        
        if (walineContainer) {
            fixWalineAlignment();
            // 监听DOM变化，处理动态加载的评论
            observeWalineChanges();
        } else {
            // 如果Waline还没加载，等待一段时间后重试
            setTimeout(waitForWaline, 500);
        }
    }
    
    // 修复Waline对齐问题的主函数
    function fixWalineAlignment() {
        console.log('开始修复Waline评论区对齐问题...');
        
        // 查找所有可能的评论头部元素
        const headSelectors = [
            '.wl-head',
            '[class*="wl-head"]',
            '.wl-card > div:first-child',
            '.wl-item > div:first-child'
        ];
        
        headSelectors.forEach(selector => {
            const heads = document.querySelectorAll(selector);
            heads.forEach(head => {
                fixSingleCommentAlignment(head);
            });
        });
        
        console.log('Waline评论区对齐修复完成');
    }
    
    // 修复单个评论的对齐问题
    function fixSingleCommentAlignment(head) {
        if (!head) return;
        
        // 强制设置头部样式
        head.style.cssText = `
            display: flex !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 12px 16px !important;
            box-sizing: border-box !important;
            position: relative !important;
            flex-wrap: nowrap !important;
            min-height: 60px !important;
        `;
        
        // 查找头像元素
        const avatar = head.querySelector('img') || 
                      head.querySelector('[class*="avatar"]') ||
                      head.querySelector('[src*="avatar"]');
        
        if (avatar) {
            avatar.style.cssText = `
                width: 44px !important;
                height: 44px !important;
                border-radius: 50% !important;
                margin: 0 !important;
                padding: 0 !important;
                flex-shrink: 0 !important;
                object-fit: cover !important;
                border: 2px solid white !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                display: block !important;
                vertical-align: top !important;
                align-self: flex-start !important;
                float: none !important;
                position: relative !important;
            `;
        }
        
        // 查找用户信息区域
        const userInfo = head.querySelector('[class*="wl-user"]') ||
                        head.querySelector('div:not([class*="avatar"]):not(img)') ||
                        head.querySelector('span:not([class*="avatar"]):not(img)');
        
        if (userInfo) {
            userInfo.style.cssText = `
                flex: 1 !important;
                margin: 0 !important;
                padding: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                align-items: flex-start !important;
                align-self: flex-start !important;
                min-height: 44px !important;
                float: none !important;
                position: relative !important;
            `;
        }
        
        // 查找昵称元素
        const nick = head.querySelector('[class*="wl-nick"]') ||
                    head.querySelector('a') ||
                    head.querySelector('[class*="nick"]');
        
        if (nick) {
            nick.style.cssText = `
                margin: 0 !important;
                padding: 0 !important;
                font-size: 15px !important;
                font-weight: 600 !important;
                line-height: 1.4 !important;
                color: var(--font-color, #4c4948) !important;
                display: block !important;
                text-decoration: none !important;
                vertical-align: top !important;
                align-self: flex-start !important;
                float: none !important;
                position: relative !important;
            `;
        }
        
        // 查找时间元素
        const time = head.querySelector('[class*="wl-time"]') ||
                    head.querySelector('time') ||
                    head.querySelector('[class*="time"]');
        
        if (time) {
            time.style.cssText = `
                margin: 2px 0 0 0 !important;
                padding: 0 !important;
                font-size: 12px !important;
                color: var(--font-color-secondary, #666) !important;
                display: block !important;
                line-height: 1.3 !important;
            `;
        }
    }
    
    // 监听DOM变化，处理动态加载的评论
    function observeWalineChanges() {
        const observer = new MutationObserver(function(mutations) {
            let shouldFix = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // 元素节点
                            // 检查是否是新的评论元素
                            if (node.classList && (
                                node.classList.contains('wl-card') ||
                                node.classList.contains('wl-item') ||
                                node.querySelector && node.querySelector('[class*="wl-head"]')
                            )) {
                                shouldFix = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldFix) {
                setTimeout(fixWalineAlignment, 100);
            }
        });
        
        // 开始观察
        const walineContainer = document.querySelector('.waline-container') || 
                               document.querySelector('[class*="waline"]') ||
                               document.querySelector('#waline') ||
                               document.body;
        
        observer.observe(walineContainer, {
            childList: true,
            subtree: true
        });
    }
    
    // 页面加载完成后开始修复
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForWaline);
    } else {
        waitForWaline();
    }
    
    // 也在窗口加载完成后再次修复，确保所有资源都已加载
    window.addEventListener('load', function() {
        setTimeout(waitForWaline, 1000);
    });
    
})();