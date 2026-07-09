@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title DH NOTEBOOK - Automated Backup System
color 0B

echo ===================================================
echo     DH NOTEBOOK - FIRESTORE AUTOMATED BACKUP
echo ===================================================
echo.
echo ระบบกำลังเชื่อมต่อกับฐานข้อมูลเพื่อดึงข้อมูลสำรอง...
echo กรุณารอสักครู่ (อาจใช้เวลา 1-3 นาทีขึ้นอยู่กับขนาดข้อมูล)
echo.

node scripts/backupDatabase.mjs

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================
    echo [✓] การสำรองข้อมูลเสร็จสมบูรณ์!
    echo ===================================================
    color 0A
) else (
    echo.
    echo ===================================================
    echo [X] เกิดข้อผิดพลาดระหว่างการสำรองข้อมูล!
    echo โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
    echo ===================================================
    color 0C
)

echo.
echo กดปุ่มใดๆ เพื่อปิดหน้าต่างนี้...
pause > nul
