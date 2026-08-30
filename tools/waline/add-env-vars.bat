@echo off
echo 添加 LeanCloud 环境变量
echo =====================================

cd /d "%~dp0waline-vercel"

echo 请在 Vercel 控制台安全配置以下变量：
echo   LEAN_ID
echo   LEAN_KEY
echo   LEAN_MASTER_KEY
echo 不要把真实密钥写入脚本或提交到 Git。

echo 重新部署...
vercel --prod

echo 部署完成！
pause
