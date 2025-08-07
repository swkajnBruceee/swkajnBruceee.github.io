@echo off
chcp 65001 > nul
title Waline服务保活工具

echo ======================================
echo        Waline服务保活工具
echo ======================================
echo.

:: 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js环境，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b
)

:: 检查keep-waline-alive.js是否存在
if not exist "%~dp0keep-waline-alive.js" (
    echo [错误] 未找到keep-waline-alive.js脚本文件
    echo 请确保该文件与本批处理文件在同一目录下
    echo.
    pause
    exit /b
)

echo [信息] 正在启动Waline服务保活工具...
echo [提示] 此工具将定期访问您的Waline服务，防止Railway应用休眠
echo [提示] 您可以在脚本运行时按Ctrl+C停止运行
echo.

:: 询问服务器URL
set /p serverURL=请输入Waline服务器URL(直接回车将尝试从配置文件读取): 

:: 询问访问间隔
set /p interval=请输入访问间隔时间(分钟，直接回车默认为10): 

echo.
echo [信息] 正在启动保活服务...
echo.

:: 运行Node.js脚本
if "%serverURL%"=="" (
    if "%interval%"=="" (
        node "%~dp0keep-waline-alive.js"
    ) else (
        node "%~dp0keep-waline-alive.js" "" %interval%
    )
) else (
    if "%interval%"=="" (
        node "%~dp0keep-waline-alive.js" %serverURL%
    ) else (
        node "%~dp0keep-waline-alive.js" %serverURL% %interval%
    )
)

pause