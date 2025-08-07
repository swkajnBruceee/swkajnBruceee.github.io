#!/usr/bin/env node

/**
 * Waline 完整配置指南
 */

console.log('🚀 Waline 完整配置指南');
console.log('=====================================');

console.log('✅ 已完成的步骤：');
console.log('1. ✅ Waline 服务代码已部署');
console.log('2. ✅ JWT_TOKEN 已配置');
console.log('3. ✅ 基础环境变量已设置');

console.log('\n📋 还需要完成的步骤：');

console.log('\n步骤1：配置数据库（选择一种）');
console.log('');
console.log('🔥 方案A：LeanCloud（推荐，国内稳定）');
console.log('1. 访问：https://console.leancloud.cn/');
console.log('2. 注册账号并登录');
console.log('3. 点击"创建应用"');
console.log('4. 应用名称：waline-comments');
console.log('5. 进入应用 > 设置 > 应用凭证');
console.log('6. 复制以下信息：');
console.log('   - App ID');
console.log('   - App Key');
console.log('   - Master Key');
console.log('');
console.log('然后运行以下命令添加环境变量：');
console.log('cd coments_config/waline-vercel');
console.log('vercel env add LEAN_ID');
console.log('vercel env add LEAN_KEY');
console.log('vercel env add LEAN_MASTER_KEY');

console.log('\n🌍 方案B：MongoDB Atlas（国际化）');
console.log('1. 访问：https://www.mongodb.com/cloud/atlas');
console.log('2. 注册账号并创建免费集群');
console.log('3. 创建数据库用户');
console.log('4. 设置网络访问（允许所有IP：0.0.0.0/0）');
console.log('5. 获取连接字符串');
console.log('');
console.log('然后运行：');
console.log('vercel env add MONGO_DB');

console.log('\n步骤2：重新部署');
console.log('cd coments_config/waline-vercel');
console.log('vercel --prod');

console.log('\n步骤3：测试和设置');
console.log('1. 访问：https://waline-delta-red-82.vercel.app/ui');
console.log('2. 注册管理员账号');
console.log('3. 测试评论功能');

console.log('\n🎯 推荐选择 LeanCloud，因为：');
console.log('- 国内服务，连接更稳定');
console.log('- 配置更简单');
console.log('- 免费额度充足');
console.log('- Waline 官方推荐');

console.log('\n📞 如果遇到问题：');
console.log('1. 检查环境变量是否正确设置');
console.log('2. 确认数据库服务正常');
console.log('3. 查看 Vercel 部署日志');
console.log('4. 运行测试脚本：node coments_config/test-waline-status.js');

console.log('\n🎉 完成后，你的博客就有完整的评论系统了！');