@echo off
chcp 65001 > nul
title Deploying Security Rules
cd /d "%~dp0\.."

echo ==================================================
echo   🛡️ Deploying Security Rules (Firestore + Storage)
echo ==================================================
echo.

call firebase deploy --only firestore:rules,storage
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ [ERROR] Security Rules Deployment ล้มเหลว!
    pause
    exit /b 1
)

echo.
echo ==================================================
echo ✅ Security Rules Deployment Complete!
echo ==================================================
pause
