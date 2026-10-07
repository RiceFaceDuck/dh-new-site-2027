@echo off
chcp 65001 > nul
TITLE Deploying DH Notebook Staff App
cd /d "%~dp0"

echo --------------------------------------------------
echo [1/3] Entering Project Folder...
cd dh-staff-app

echo [2/3] Building System (Vite + React)...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ [ERROR] Build ล้มเหลว! การ Deploy ถูกยกเลิกอัตโนมัติ
    cd ..
    pause
    exit /b 1
)
cd ..

echo [3/3] Deploying to Firebase Hosting...
call firebase deploy --only hosting:dh-notebook-69f3b
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ [ERROR] Firebase Deployment ล้มเหลว!
    pause
    exit /b 1
)

echo --------------------------------------------------
echo ✅ Staff App Deployment Complete!
echo URL: https://dh-notebook-69f3b.web.app
echo --------------------------------------------------
pause