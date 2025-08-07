#!/usr/bin/env node

const fs = require('fs');

console.log('🔄 更新博客配置...');

// 读取当前配置
let config = fs.readFileSync('_config.butterfly.yml', 'utf8');

// 提示用户输入新的域名
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('请输入你的 Vercel 域名（如：your-app.vercel.app）: ', (domain) => {
    // 更新 serverURL
    config = config.replace(
        /serverURL:\s*https:\/\/[^\s]+/,
        `serverURL: https://${domain}/`
    );
    
    // 写回文件
    fs.writeFileSync('_config.butterfly.yml', config);
    
    console.log('✅ 配置已更新');
    console.log(`🔗 新的 serverURL: https://${domain}/`);
    console.log('');
    console.log('下一步：');
    console.log('1. hexo clean && hexo g && hexo d');
    console.log(`2. 访问 https://${domain}/ui 设置管理员`);
    
    rl.close();
});
