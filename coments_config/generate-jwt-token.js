#!/usr/bin/env node

/**
 * 生成 JWT Token 的脚本
 */

const crypto = require('crypto');

console.log('🔑 JWT Token 生成器');
console.log('=====================================');

console.log('📝 什么是 JWT_TOKEN？');
console.log('JWT_TOKEN 是 Waline 用来加密数据的密钥，需要是一个随机字符串。');
console.log('它不需要从外部服务获取，只需要生成一个安全的随机字符串即可。');

console.log('\n🎲 生成新的 JWT Token：');

// 生成多个不同长度的 Token 供选择
const tokens = {
    '32位': crypto.randomBytes(16).toString('hex'),
    '64位': crypto.randomBytes(32).toString('hex'),
    '128位': crypto.randomBytes(64).toString('hex')
};

for (const [length, token] of Object.entries(tokens)) {
    console.log(`${length}: ${token}`);
}

console.log('\n✅ 推荐使用 64位 Token（安全性更好）');

const recommendedToken = tokens['64位'];
console.log(`\n🔐 推荐的 JWT_TOKEN: ${recommendedToken}`);

console.log('\n📋 如何使用：');
console.log('1. 复制上面的 64位 Token');
console.log('2. 在 Vercel 项目中添加环境变量：');
console.log(`   JWT_TOKEN = ${recommendedToken}`);
console.log('3. 或者使用 CLI 命令添加：');
console.log(`   vercel env add JWT_TOKEN`);
console.log('   然后粘贴 Token 值');

console.log('\n⚠️  重要提示：');
console.log('- JWT_TOKEN 是敏感信息，不要公开分享');
console.log('- 每个 Waline 实例应该使用不同的 JWT_TOKEN');
console.log('- 一旦设置，不要随意更改（会影响现有数据）');

console.log('\n🎯 下一步：');
console.log('使用这个 Token 配置你的 Waline 环境变量');

module.exports = recommendedToken;