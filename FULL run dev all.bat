@echo off
title DH Projects - Start All Dev Servers
color 0A

echo =========================================
echo   Starting All DH Projects...
echo =========================================
echo.

:: 1. รันโปรเจกต์ Backoffice
echo [1/3] Starting DH Backoffice...
start "DH Backoffice" cmd /k "cd /d "C:\DH Notebook\Management System\dh-backoffice-react" && npm install && npm run dev"

:: 2. รันโปรเจกต์ Frontend Main Site
echo [2/3] Starting DH Frontend...
start "DH Frontend" cmd /k "cd /d "C:\DH Notebook\Management System\dh-frontend" && npm install && npm run dev"

:: 3. รันโปรเจกต์ Staff App
echo [3/3] Starting DH Staff App...
start "DH Staff App" cmd /k "cd /d "C:\DH Notebook\Management System\dh-staff-app" && npm install && npm run dev"

echo.
echo =========================================
echo All servers are starting in separate windows!
echo =========================================
exit