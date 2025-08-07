/**
 * 评论系统切换脚本
 * 用于在Waline和Giscus评论系统之间切换
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 配置文件路径
const configPath = path.join(__dirname, '_config.butterfly.yml');

// 获取命令行参数
const args = process.argv.slice(2);
const targetSystem = args[0]?.toLowerCase();

if (!targetSystem || (targetSystem !== 'waline' && targetSystem !== 'giscus')) {
  console.error('请指定要切换的评论系统: waline 或 giscus');
  console.log('使用方法: node switch-comments.js waline');
  console.log('使用方法: node switch-comments.js giscus');
  process.exit(1);
}

// 读取配置文件
try {
  const fileContent = fs.readFileSync(configPath, 'utf8');
  const config = yaml.load(fileContent);
  
  // 备份当前配置
  const backupPath = `${configPath}.backup-${Date.now()}`;
  fs.writeFileSync(backupPath, fileContent);
  console.log(`已备份当前配置到: ${backupPath}`);
  
  // 更新评论系统配置
  const capitalizedSystem = targetSystem.charAt(0).toUpperCase() + targetSystem.slice(1);
  config.comments.use = capitalizedSystem;
  
  // 将配置写回文件
  const newContent = yaml.dump(config);
  fs.writeFileSync(configPath, newContent, 'utf8');
  
  console.log(`✅ 已成功切换到 ${capitalizedSystem} 评论系统`);
  console.log('请运行以下命令重新生成博客:');
  console.log('hexo clean && hexo generate && hexo server');
  
} catch (error) {
  console.error('切换评论系统时出错:', error);
  process.exit(1);
}