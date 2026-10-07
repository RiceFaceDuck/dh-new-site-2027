@echo off
title DH NOTEBOOK - Master Deployment Center
cd /d "%~dp0"
node scripts\deploy_center.mjs
if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] Program exited with code %ERRORLEVEL%
    pause
)