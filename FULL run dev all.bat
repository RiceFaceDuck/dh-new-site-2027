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
    start "DH Backoffice" /D "%BASE_DIR%dh-backoffice-react" cmd /k "echo Installing dependencies... && npm install && npm run dev -- --port 3168 --strictPort"
) else (
    start "DH Backoffice" /D "%BASE_DIR%dh-backoffice-react" cmd /k "npm run dev -- --port 3168 --strictPort"
)

:: 2. Frontend Main Site
echo [2/3] Starting DH Frontend...
if not exist "%BASE_DIR%dh-frontend\node_modules" (
    start "DH Frontend" /D "%BASE_DIR%dh-frontend" cmd /k "echo Installing dependencies... && npm install && npm run dev -- --port 8988 --strictPort"
) else (
    start "DH Frontend" /D "%BASE_DIR%dh-frontend" cmd /k "npm run dev -- --port 8988 --strictPort"
)

:: 3. Staff App
echo [3/3] Starting DH Staff App...
if not exist "%BASE_DIR%dh-staff-app\node_modules" (
    start "DH Staff App" /D "%BASE_DIR%dh-staff-app" cmd /k "echo Installing dependencies... && npm install && npm run dev -- --port 3122 --strictPort"
) else (
    start "DH Staff App" /D "%BASE_DIR%dh-staff-app" cmd /k "npm run dev -- --port 3122 --strictPort"
)

echo.
echo ========================================================
echo [SUCCESS] All servers are booting up in separate windows!
echo ========================================================
timeout /t 3 >nul
exit