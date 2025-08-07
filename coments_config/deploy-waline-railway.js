#!/usr/bin/env node

/**
 * Railway 部署 Waline 脚本
 * Railway 比 Vercel 更稳定，推荐使用
 */

const fs = require('fs');
const crypto = require('crypto');

console.log('🚄 Railway 部署 Waline 脚本');
console.log('=====================================');

// 生成配置
const jwtToken = crypto.randomBytes(32).toString('hex');

console.log('🔑 生成的配置信息：');
console.log(`JWT_TOKEN: ${jwtToken}`);

console.log('\n📋 Railway 部署步骤：');
console.log('1. 访问 https://railway.app/');
console.log('2. 使用 GitHub 账号登录');
console.log('3. 点击 "New Project"');
console.log('4. 选择 "Deploy from GitHub repo"');
console.log('5. 选择 walinejs/waline 仓库');
console.log('6. 或者使用一键部署链接：');
console.log('   https://railway.app/template/oWH0Md');

console.log('\n⚙️  环境变量配置：');
console.log('在 Railway 项目设置中添加以下环境变量：');
console.log('');
console.log(`JWT_TOKEN=${jwtToken}`);
console.log('MONGO_DB=你的MongoDB连接字符串');
console.log('SITE_NAME=BruceLee Blog');
console.log('SITE_URL=https://swkajnbruceee.github.io');
console.log('SECURE_DOMAINS=swkajnbruceee.github.io');
console.log('ADMIN_EMAIL=your-email@example.com');

console.log('\n🗄️  MongoDB 设置：');
console.log('1. 访问 https://www.mongodb.com/cloud/atlas');
console.log('2. 注册并创建免费集群');
console.log('3. 创建数据库用户');
console.log('4. 设置网络访问（允许所有 IP：0.0.0.0/0）');
console.log('5. 获取连接字符串，格式如下：');
console.log('   mongodb+srv://username:password@cluster.mongodb.net/waline');

console.log('\n🚀 部署完成后：');
console.log('1. Railway 会提供一个域名，如：https://your-app.railway.app');
console.log('2. 更新博客配置中的 serverURL');
console.log('3. 访问 https://your-app.railway.app/ui 设置管理员');

console.log('\n💡 Railway 优势：');
console.log('- 更稳定的服务');
console.log('- 更好的性能');
console.log('- 免费额度充足');
console.log('- 支持自定义域名');

// 更新博客配置的脚本
const updateConfigScript = `
# 更新博客配置脚本
# 将 RAILWAY_DOMAIN 替换为你的 Railway 域名

RAILWAY_DOMAIN="your-app.railway.app"

# 备份原配置
cp _config.butterfly.yml _config.butterfly.yml.backup

# 更新 serverURL
sed -i "s|serverURL:.*|serverURL: https://\$RAILWAY_DOMAIN/|g" _config.butterfly.yml

echo "✅ 配置已更新，请检查 _config.butterfly.yml 中的 serverURL"
`;

fs.writeFileSync('coments_config/update-config.sh', updateConfigScript);

console.log('\n📝 已创建配置更新脚本: coments_config/update-config.sh');
console.log('\n🎉 按照上述步骤操作，你的 Waline 评论系统就能正常工作了！');