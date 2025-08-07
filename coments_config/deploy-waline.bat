@echo off
echo ======================================
echo    Waline评论系统部署助手
echo ======================================
echo.

:: 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b
)

echo [信息] 检测到Node.js已安装
echo.

:: 显示部署选项
echo 请选择部署方式:
echo 1. Railway部署 (推荐，更稳定)
echo 2. 一键部署 (自动打开浏览器)
echo 3. 检查Waline状态
echo 4. 测试MongoDB连接
echo 5. 切换评论系统
echo 6. 启动保活脚本 (防止Railway应用休眠)
echo 7. 测试Waline服务 (检查各接口)
echo.

set /p choice=请输入选项 (1-7): 

if "%choice%"=="1" (
    echo.
    echo [信息] 启动Railway部署脚本...
    node deploy-waline-railway.js
) else if "%choice%"=="2" (
    echo.
    echo [信息] 启动一键部署脚本...
    node one-click-deploy.js
) else if "%choice%"=="3" (
    echo.
    echo [信息] 检查Waline状态...
    node check-waline-status.js
) else if "%choice%"=="4" (
    echo.
    echo [信息] 测试MongoDB连接...
    node test-mongo.js
) else if "%choice%"=="5" (
    echo.
    echo [信息] 切换评论系统...
    node switch-comments.js
) else if "%choice%"=="6" (
    echo.
    echo [信息] 启动Waline服务保活脚本...
    start cmd /k "%~dp0keep-waline-alive.bat"
) else if "%choice%"=="7" (
    echo.
    echo [信息] 测试Waline服务...
    node test-waline.js
) else (
    echo.
    echo [错误] 无效的选项
)

echo.
echo 操作完成
pause