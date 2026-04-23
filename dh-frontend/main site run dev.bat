@echo off
echo =========================================
echo   Starting DH Frontend (React + Vite)
echo =========================================

:: ย้ายไปที่โฟลเดอร์โปรเจกต์ตามภาพ
cd /d "C:\DH Notebook\Management System\dh-frontend"

:: ติดตั้ง Package (ถ้ามีครบแล้วมันจะข้ามไปไวมาก)
echo Installing...
call npm install

:: รัน Server
echo Starting Server...
npm run dev

pause