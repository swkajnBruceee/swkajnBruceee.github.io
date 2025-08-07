#!/usr/bin/env node

/**
 * 评论系统切换脚本
 * 使用方法：node switch-comments.js [waline|giscus]
 */

const fs = require('fs');
const path = require('path');

const configFile = '_config.butterfly.yml';
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('🔄 评论系统切换脚本');
    console.log('=====================================');
    console.log('使用方法：');
    console.log('  node switch-comments.js waline   # 切换到 Waline');
    console.log('  node switch-comments.js giscus   # 切换到 Giscus');
    console.log('');
    console.log('当前支持的评论系统：');
    console.log('  • Waline  - 功能强大，支持匿名评论');
    console.log('  • Giscus  - 基于GitHub，简单易用');
    process.exit(0);
}

const targetSystem = args[0].toLowerCase();

if (!['waline', 'giscus'].includes(targetSystem)) {
    console.error('❌ 不支持的评论系统：' + targetSystem);
    console.error('支持的系统：waline, giscus');
    process.exit(1);
}

// 读取配置文件
if (!fs.existsSync(configFile)) {
    console.error('❌ 未找到配置文件：' + configFile);
    process.exit(1);
}

let config = fs.readFileSync(configFile, 'utf8');

// 切换评论系统
const systemName = targetSystem === 'waline' ? 'Waline' : 'Giscus';
const regex = /comments:\s*\n\s*use:\s*\w+/;
const replacement = `comments:\n  use: ${systemName}`;

if (regex.test(config)) {
    config = config.replace(regex, replacement);
    fs.writeFileSync(configFile, config);
    
    console.log('✅ 评论系统已切换到：' + systemName);
    console.log('');
    
    if (targetSystem === 'waline') {
        console.log('📝 Waline 配置提醒：');
        console.log('1. 确保已部署 Waline 服务器');
        console.log('2. 检查 serverURL 配置是否正确');
        console.log('3. 访问 你的域名/ui 设置管理员');
    } else {
        console.log('📝 Giscus 配置提醒：');
        console.log('1. 确保 GitHub 仓库已启用 Discussions');
        console.log('2. 检查 repo_id 和 category_id 是否正确');
        console.log('3. 确保仓库是公开的');
    }
    
    console.log('');
    console.log('🔄 请运行以下命令重新部署：');
    console.log('hexo clean && hexo g && hexo d');
    
} else {
    console.error('❌ 未找到评论系统配置，请检查配置文件格式');
    process.exit(1);
}