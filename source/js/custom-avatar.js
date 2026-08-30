// 自定义头像随机选择功能
(function() {
    // 自定义头像列表
    const customAvatars = [
        '/img/avatars/avatar1.svg',
        '/img/avatars/avatar2.svg',
        '/img/avatars/avatar3.svg',
        '/img/avatars/avatar4.svg',
        '/img/avatars/avatar5.svg',
        '/img/avatars/avatar6.svg'
    ];

    // 根据邮箱生成一致的随机头像
    function getCustomAvatar(email) {
        if (!email) {
            // 如果没有邮箱，使用时间戳生成随机头像
            const index = Math.floor(Math.random() * customAvatars.length);
            return customAvatars[index];
        }
        
        // 使用邮箱生成哈希值，确保同一邮箱总是显示相同头像
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            const char = email.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        const index = Math.abs(hash) % customAvatars.length;
        return customAvatars[index];
    }

    // 替换头像的函数
    function replaceAvatars() {
        const avatars = document.querySelectorAll('.wl-avatar img, .wl-user-avatar img, img[src*="gravatar"], img[src*="avatar"]');
        avatars.forEach((img) => {
            if (img.src && (img.src.includes('gravatar') || img.src.includes('loli.net') || img.src.includes('wavatar') || img.src.includes('mp'))) {
                // 获取评论者邮箱（如果有的话）
                const commentItem = img.closest('.wl-item, .wl-comment');
                let email = '';
                if (commentItem) {
                    const emailElement = commentItem.querySelector('[data-email]');
                    email = emailElement ? emailElement.getAttribute('data-email') : '';
                }
                
                // 替换为自定义头像
                const newSrc = getCustomAvatar(email);
                if (img.src !== newSrc) {
                    img.src = newSrc;
                    img.onerror = function() {
                        // 如果自定义头像加载失败，使用第一个头像作为备用
                        this.src = customAvatars[0];
                    };
                }
            }
        });
    }

    // 监听DOM变化
    function observeChanges() {
        const observer = new MutationObserver((mutations) => {
            let shouldReplace = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // 元素节点
                            if (node.querySelector && (node.querySelector('.wl-avatar img') || node.querySelector('img[src*="gravatar"]') || node.querySelector('img[src*="avatar"]'))) {
                                shouldReplace = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldReplace) {
                setTimeout(replaceAvatars, 100); // 延迟执行，确保DOM完全加载
            }
        });
        
        // 观察整个文档
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        return observer;
    }

    // 初始化函数
    function initCustomAvatar() {
        console.log('Custom avatar script loaded');
        
        // 立即替换现有头像
        replaceAvatars();
        
        // 开始观察DOM变化
        observeChanges();
        
        // 定期检查并替换头像
        setInterval(replaceAvatars, 2000);
        
        // 监听Waline相关事件
        document.addEventListener('waline:init', replaceAvatars);
        document.addEventListener('waline:comment', replaceAvatars);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCustomAvatar);
    } else {
        initCustomAvatar();
    }
})();