@echo off
setlocal enabledelayedexpansion
title DH Projects - Start All Dev Servers
color 0B

set "BASE_DIR=%~dp0"

echo ========================================================
echo   DH NOTEBOOK - FULL DEV ENVIRONMENT STARTUP
echo ========================================================
echo.

:: 1. Backoffice
echo [1/3] Starting DH Backoffice...
if not exist "%BASE_DIR%dh-backoffice-react\node_modules" (
    start "DH Backoffice" cmd /k "cd /d "%BASE_DIR%dh-backoffice-react" && echo Installing dependencies... && npm install && npm run dev"
) else (
    start "DH Backoffice" cmd /k "cd /d "%BASE_DIR%dh-backoffice-react" && npm run dev"
)

:: 2. Frontend Main Site
echo [2/3] Starting DH Frontend...
if not exist "%BASE_DIR%dh-frontend\node_modules" (
    start "DH Frontend" cmd /k "cd /d "%BASE_DIR%dh-frontend" && echo Installing dependencies... && npm install && npm run dev"
) else (
    start "DH Frontend" cmd /k "cd /d "%BASE_DIR%dh-frontend" && npm run dev"
)

:: 3. Staff App
echo [3/3] Starting DH Staff App...
if not exist "%BASE_DIR%dh-staff-app\node_modules" (
    start "DH Staff App" cmd /k "cd /d "%BASE_DIR%dh-staff-app" && echo Installing dependencies... && npm install && npm run dev"
) else (
    start "DH Staff App" cmd /k "cd /d "%BASE_DIR%dh-staff-app" && npm run dev"
)

echo.
echo ========================================================
echo [SUCCESS] All servers are booting up in separate windows!
echo ========================================================
timeout /t 3 >nul
exit