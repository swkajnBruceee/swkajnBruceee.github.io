// 轻量级AI摘要功能 - 性能优化版
(function() {
  'use strict';
  
  // 只在文章页面显示AI摘要
  if (!document.querySelector('.post-content')) return;
  
  // 延迟初始化，避免阻塞页面加载
  setTimeout(initAISummary, 500);
  
  function initAISummary() {
    const aiSummaryHTML = `
      <div class="ai-summary" id="ai-summary">
        <div class="ai-summary-header">
          <div class="ai-summary-left">
            <div class="ai-summary-icon">AI</div>
            <h3 class="ai-summary-title">AI摘要</h3>
          </div>
          <div class="ai-summary-right">
            <span class="ai-summary-badge">智能生成</span>
            <button class="ai-summary-refresh" onclick="refreshAISummary()">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
        <div class="ai-summary-content">
          <div class="ai-summary-text" id="ai-summary-text">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            正在生成摘要...
          </div>
        </div>
        <div class="ai-summary-footer">
          <div class="ai-summary-info">
            <i class="fas fa-robot"></i>
            由AI智能生成
          </div>
        </div>
      </div>
    `;
    
    const postContent = document.querySelector('.post-content');
    if (postContent) {
      postContent.insertAdjacentHTML('beforebegin', aiSummaryHTML);
      setTimeout(generateAISummary, 800);
    }
  }
  
  // 打字机效果函数
  function typeWriter(element, text, speed = 40) {
    element.innerHTML = '';
    let i = 0;
    
    function type() {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        // 打字完成后添加光标闪烁效果
        element.innerHTML += '<span class="typing-cursor"></span>';
      }
    }
    
    type();
  }
  
  // 生成AI摘要
  function generateAISummary() {
    const summaryElement = document.getElementById('ai-summary-text');
    const aiSummary = document.getElementById('ai-summary');
    
    if (!summaryElement || !aiSummary) return;
    
    // 移除加载状态
    aiSummary.classList.remove('loading');
    
    // 获取文章标题和内容
    const title = document.querySelector('h1.post-title')?.textContent || '';
    const content = document.querySelector('.post-content')?.textContent || '';
    
    // 智能分析文章内容生成摘要
    const intelligentSummary = generateIntelligentSummary(title, content);
    
    // 使用打字机效果显示摘要
    setTimeout(() => {
      typeWriter(summaryElement, intelligentSummary, 35);
    }, 300);
  }
  
  // 智能摘要生成函数 - 平衡版本
  function generateIntelligentSummary(title, content) {
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    const wordCount = cleanContent.length;
    const readingTime = Math.ceil(wordCount / 300);
    
    // 提取关键信息
    const keyTerms = extractKeyTerms(cleanContent);
    const articleType = determineArticleType(title, cleanContent);
    const codeInfo = extractCodeInfo();
    const difficulty = assessDifficulty(cleanContent, title);
    
    // 生成结构化摘要
    return generateStructuredSummary(title, articleType, keyTerms, readingTime, codeInfo, difficulty);
  }
  
  // 提取关键词
  function extractKeyTerms(content) {
    const techTerms = [
      'JavaScript', 'Python', 'Java', 'React', 'Vue', 'Node.js', 'HTML', 'CSS',
      'API', '算法', '数据结构', '机器学习', '人工智能', '数据库',
      '前端', '后端', '框架', '库', '工具', '部署', '测试', '优化'
    ];
    
    const foundTerms = techTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );
    
    return foundTerms.slice(0, 4);
  }
  
  // 判断文章类型
  function determineArticleType(title, content) {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (titleLower.includes('教程') || titleLower.includes('如何') || 
        titleLower.includes('tutorial') || contentLower.includes('步骤')) {
      return 'tutorial';
    }
    
    if (titleLower.includes('原理') || titleLower.includes('理论') || 
        titleLower.includes('概念') || contentLower.includes('算法')) {
      return 'theory';
    }
    
    if (titleLower.includes('技术') || titleLower.includes('实现') || 
        contentLower.includes('代码') || contentLower.includes('开发')) {
      return 'technical';
    }
    
    if (titleLower.includes('评测') || titleLower.includes('比较') || 
        titleLower.includes('review')) {
      return 'review';
    }
    
    return 'general';
  }
  
  // 提取代码信息
  function extractCodeInfo() {
    const codeBlocks = document.querySelectorAll('.post-content pre, .post-content code');
    const languages = new Set();
    
    codeBlocks.forEach(block => {
      const className = block.className;
      if (className.includes('language-')) {
        const lang = className.match(/language-(\w+)/)?.[1];
        if (lang) languages.add(lang);
      }
    });
    
    return {
      count: codeBlocks.length,
      languages: Array.from(languages).slice(0, 3)
    };
  }
  
  // 评估文章难度
  function assessDifficulty(content, title) {
    const fullText = (content + ' ' + title).toLowerCase();
    
    const advancedTerms = ['算法复杂度', '设计模式', '架构', '优化', '源码分析', 'advanced'];
    const basicTerms = ['入门', '基础', '简介', '介绍', 'basic', 'introduction'];
    
    const advancedCount = advancedTerms.filter(term => fullText.includes(term)).length;
    const basicCount = basicTerms.filter(term => fullText.includes(term)).length;
    
    if (advancedCount >= 2) return 'advanced';
    if (basicCount >= 1) return 'beginner';
    return 'intermediate';
  }
  
  // 生成结构化摘要
  function generateStructuredSummary(title, articleType, keyTerms, readingTime, codeInfo, difficulty) {
    const typeEmojis = {
      tutorial: '📚',
      technical: '💻',
      theory: '🧠',
      review: '🔍',
      general: '📖'
    };
    
    const typeTexts = {
      tutorial: '实用教程',
      technical: '技术文章',
      theory: '理论解析',
      review: '评测分析',
      general: '技术分享'
    };
    
    const difficultyTexts = {
      beginner: '入门级',
      intermediate: '进阶',
      advanced: '高级'
    };
    
    const emoji = typeEmojis[articleType] || '📖';
    const typeText = typeTexts[articleType] || '技术文章';
    const diffText = difficultyTexts[difficulty] || '';
    
    let summary = `${emoji} 这是一篇${diffText}${typeText}，深入探讨${title}。`;
    
    // 添加技术要点
    if (keyTerms.length > 0) {
      summary += `主要涉及${keyTerms.join('、')}等技术领域。`;
    }
    
    // 添加代码信息
    if (codeInfo.count > 0) {
      summary += `文章包含${codeInfo.count}个代码示例`;
      if (codeInfo.languages.length > 0) {
        summary += `（${codeInfo.languages.join('、')}）`;
      }
      summary += '，具有很强的实践指导价值。';
    }
    
    // 添加阅读建议
    const audienceTexts = {
      beginner: '适合初学者阅读学习',
      intermediate: '适合有一定基础的开发者深入了解',
      advanced: '适合有经验的开发者进阶学习'
    };
    
    summary += `${audienceTexts[difficulty] || '适合技术爱好者阅读'}，预计阅读时间${readingTime}分钟。`;
    
    return summary;
  }
  
  // 全局刷新函数
  window.refreshAISummary = function() {
    const summaryElement = document.getElementById('ai-summary-text');
    const aiSummary = document.getElementById('ai-summary');
    const refreshBtn = document.querySelector('.ai-summary-refresh');
    
    if (!summaryElement || !aiSummary || !refreshBtn) return;
    
    // 添加加载状态
    aiSummary.classList.add('loading');
    refreshBtn.disabled = true;
    
    // 显示加载动画
    summaryElement.innerHTML = `
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      正在重新生成摘要...
    `;
    
    // 模拟API调用延迟
    setTimeout(() => {
      aiSummary.classList.remove('loading');
      refreshBtn.disabled = false;
      generateAISummary();
    }, 1200);
  };
  
  // 全局生成函数
  window.generateAISummary = generateAISummary;
})();