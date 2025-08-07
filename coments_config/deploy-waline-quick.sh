#!/bin/bash
# Waline 快速部署脚本

echo "🚀 开始部署 Waline..."

# 进入 waline-vercel 目录
cd coments_config/waline-vercel

# 安装依赖
echo "📦 安装依赖..."
npm install

# 部署到 Vercel
echo "🌐 部署到 Vercel..."
npx vercel --prod

echo "✅ 部署完成！"
echo "请在 Vercel 项目设置中配置环境变量："
echo "JWT_TOKEN: 62b24e02a8b5fa30bd54bb86ae5b3e7c6fc422cd84f83f9ac537675dec889bf2"
echo "MONGO_DB: 你的MongoDB连接字符串"
