@echo off
chcp 65001 >nul
title 工具箱服务器 (localhost:8080)
cd /d %~dp0

echo ====================================
echo   纯前端工具箱 - 本地服务器
echo   http://localhost:8080
echo   按 Ctrl+C 停止
echo ====================================
echo.

rem 检查端口是否被占用
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo [提示] 8080 端口已被占用，可能已在运行
    echo 直接打开 http://localhost:8080 即可
    timeout /t 3 >nul
    start http://localhost:8080
    exit /b 0
)

rem 启动服务器并自动打开浏览器
start "" http://localhost:8080
python -m http.server 8080 --bind 127.0.0.1
pause
