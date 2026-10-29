@echo off
chcp 65001 > nul
title Git Commit and Push to GitHub
cd /d "%~dp0\.."

echo ==================================================
echo   🚀 Git Commit and Push to GitHub (Main Branch)
echo ==================================================
echo.

echo [1/3] Preparing files (git add .) ...
call git add .

echo.
echo [2/3] Committing changes ...
set "CURRENT_DATE=%date%"
set "CURRENT_TIME=%time:~0,8%"
call git commit -m "อัปเดตงาน %CURRENT_DATE% %CURRENT_TIME%"

echo.
echo [3/3] Pushing to GitHub (origin main) ...
call git push origin main
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ [ERROR] Push to GitHub ล้มเหลว! โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
    pause
    exit /b 1
)

echo.
echo ==================================================
echo ✅ Done! All updates have been pushed to GitHub.
echo ==================================================
pause
