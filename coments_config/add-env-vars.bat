@echo off
echo 🚀 添加 LeanCloud 环境变量
echo =====================================

cd coments_config\waline-vercel

echo 📝 添加 LEAN_ID...
echo 0Pe3svUOqZeQp1nbgNnPokwt-gzGzoHsz | vercel env add LEAN_ID production

echo 📝 添加 LEAN_KEY...
echo 3hsumCrrMf6s8l6CIYVQLzo1 | vercel env add LEAN_KEY production

echo 📝 添加 LEAN_MASTER_KEY...
echo kOkPBe9I1qw2V7dehhY9hPGG | vercel env add LEAN_MASTER_KEY production

echo ✅ 环境变量添加完成！

echo 🚀 重新部署...
vercel --prod

echo 🎉 部署完成！
pause