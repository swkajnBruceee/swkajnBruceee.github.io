#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');

console.log('🔧 Vercel 部署修复指南');
console.log('=====================================');

// 生成新的 JWT Token
const jwtToken = crypto.randomBytes(32).toString('hex');

console.log('🔑 生成的新 JWT Token:');
console.log(jwtToken);

// 创建环境变量配置文件
const envConfig = `JWT_TOKEN=${jwtToken}
MONGO_DB=mongodb+srv://username:password@cluster.mongodb.net/waline
SITE_NAME=BruceLee Blog
SITE_URL=https://swkajnbruceee.github.io
SECURE_DOMAINS=swkajnbruceee.github.io
ADMIN_EMAIL=your-email@example.com`;

fs.writeFileSync('coments_config/waline-vercel/.env.local', envConfig);

console.log('\n✅ 已创建环境变量配置文件');

console.log('\n📋 部署步骤:');
console.log('1. 安装 Vercel CLI: npm install -g vercel');
console.log('2. 进入目录: cd coments_config/waline-vercel');
console.log('3. 登录 Vercel: vercel login');
console.log('4. 部署: vercel --prod');

console.log('\n⚙️  在 Vercel 项目设置中配置环境变量:');
console.log(`JWT_TOKEN: ${jwtToken}`);
console.log('MONGO_DB: 你的MongoDB连接字符串');
console.log('SITE_NAME: BruceLee Blog');
console.log('SITE_URL: https://swkajnbruceee.github.io');
console.log('SECURE_DOMAINS: swkajnbruceee.github.io');

console.log('\n🗄️  MongoDB 设置:');
console.log('1. 访问: https://www.mongodb.com/cloud/atlas');
console.log('2. 创建免费集群');
console.log('3. 创建数据库用户');
console.log('4. 设置网络访问为 0.0.0.0/0');
console.log('5. 获取连接字符串');

console.log('\n🎉 部署完成后更新博客配置并测试!');