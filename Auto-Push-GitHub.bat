@echo off
title Auto Push to GitHub
color 0A

echo =========================================
echo   Auto Push to GitHub (DH Management System)
echo =========================================
echo.

:: 1. เข้าไปยังโฟลเดอร์โปรเจกต์หลัก
cd /d "C:\DH Notebook\Management System"

:: 2. เตรียมไฟล์ทั้งหมด [git add .]
echo [1/3] Preparing files (git add .) ...
git add .
echo.

:: 3. ดึงวันที่และเวลาปัจจุบันของเครื่อง
set "CURRENT_DATE=%date%"
set "CURRENT_TIME=%time:~0,8%"

:: 4. บันทึกงานลงเครื่องพร้อมวันที่และเวลา
echo [2/3] Committing changes ...
git commit -m "อัปเดตงาน %CURRENT_DATE% %CURRENT_TIME%"
echo.

:: 5. ส่งไปที่ GitHub
echo [3/3] Pushing to GitHub (main branch) ...
git push origin main
echo.

echo =========================================
echo   Done! All updates have been pushed.
echo =========================================
exit