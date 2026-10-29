@echo off
chcp 65001 > nul
title Deploying Firestore Indexes
cd /d "%~dp0\.."

echo ==================================================
echo   📑 Deploying Firestore Indexes
echo ==================================================
echo.

call firebase deploy --only firestore:indexes
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ [ERROR] Indexes Deployment ล้มเหลว!
    pause
    exit /b 1
)

echo.
echo ==================================================
echo ✅ Firestore Indexes Deployment Complete!
echo ==================================================
pause
