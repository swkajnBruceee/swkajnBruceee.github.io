#!/usr/bin/env node

/**
 * LeanCloud 交互式配置脚本
 */

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔥 LeanCloud 交互式配置');
console.log('=====================================');

console.log('📋 请确保你已经：');
console.log('1. ✅ 访问了 https://console.leancloud.cn/');
console.log('2. ✅ 注册并登录了账号');
console.log('3. ✅ 创建了应用（如：waline-comments）');
console.log('4. ✅ 进入了"设置" > "应用凭证"页面');

console.log('\n现在请输入你的 LeanCloud 应用凭证：');

let config = {};

function askForAppId() {
    rl.question('\n🔑 请输入 App ID: ', (appId) => {
        if (!appId.trim()) {
            console.log('❌ App ID 不能为空，请重新输入');
            askForAppId();
            return;
        }
        config.LEAN_ID = appId.trim();
        askForAppKey();
    });
}

function askForAppKey() {
    rl.question('\n🔑 请输入 App Key: ', (appKey) => {
        if (!appKey.trim()) {
            console.log('❌ App Key 不能为空，请重新输入');
            askForAppKey();
            return;
        }
        config.LEAN_KEY = appKey.trim();
        askForMasterKey();
    });
}

function askForMasterKey() {
    rl.question('\n🔑 请输入 Master Key: ', (masterKey) => {
        if (!masterKey.trim()) {
            console.log('❌ Master Key 不能为空，请重新输入');
            askForMasterKey();
            return;
        }
        config.LEAN_MASTER_KEY = masterKey.trim();
        confirmAndDeploy();
    });
}

function confirmAndDeploy() {
    console.log('\n📋 配置信息确认：');
    console.log(`LEAN_ID: ${config.LEAN_ID}`);
    console.log(`LEAN_KEY: ${config.LEAN_KEY}`);
    console.log(`LEAN_MASTER_KEY: ${config.LEAN_MASTER_KEY.substring(0, 8)}...`);
    
    rl.question('\n✅ 确认配置正确吗？(y/n): ', (confirm) => {
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
            deployConfig();
        } else {
            console.log('🔄 重新配置...');
            askForAppId();
        }
    });
}

function deployConfig() {
    console.log('\n🚀 开始配置环境变量...');
    
    try {
        // 添加环境变量的命令
        console.log('📝 配置命令：');
        console.log(`vercel env add LEAN_ID`);
        console.log(`vercel env add LEAN_KEY`);
        console.log(`vercel env add LEAN_MASTER_KEY`);
        
        console.log('\n💡 请手动执行以下步骤：');
        console.log('1. 打开新的命令行窗口');
        console.log('2. 进入目录：cd coments_config/waline-vercel');
        console.log('3. 依次运行以下命令：');
        console.log('');
        console.log(`   vercel env add LEAN_ID`);
        console.log(`   输入值：${config.LEAN_ID}`);
        console.log(`   选择环境：Production, Preview, Development`);
        console.log('');
        console.log(`   vercel env add LEAN_KEY`);
        console.log(`   输入值：${config.LEAN_KEY}`);
        console.log(`   选择环境：Production, Preview, Development`);
        console.log('');
        console.log(`   vercel env add LEAN_MASTER_KEY`);
        console.log(`   输入值：${config.LEAN_MASTER_KEY}`);
        console.log(`   选择环境：Production, Preview, Development`);
        console.log('');
        console.log('4. 重新部署：vercel --prod');
        console.log('5. 测试：node ../../test-waline-status.js');
        
        console.log('\n🎉 配置完成后，你的 Waline 评论系统就能正常工作了！');
        
    } catch (error) {
        console.log(`❌ 配置失败: ${error.message}`);
        console.log('请手动配置环境变量');
    }
    
    rl.close();
}

// 开始配置流程
askForAppId();