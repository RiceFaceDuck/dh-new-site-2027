@echo off
title DH Notebook - Dev Server
color 0A

:: 1. เข้าไปยังโฟลเดอร์โปรเจกต์
cd /d "C:\DH Notebook\Management System\dh-backoffice-react"

echo [1/2] Installing/Updating Libraries...
call npm install

echo.
echo [2/2] Starting Development Server...
call npm run dev

pause