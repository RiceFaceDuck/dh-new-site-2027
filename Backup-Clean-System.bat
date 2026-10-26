@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title DH NOTEBOOK - DUAL CLEAN SYSTEM BACKUP
color 0B

echo ===================================================
echo     DH NOTEBOOK - DUAL CLEAN SYSTEM BACKUP
echo ===================================================
echo.
echo กำลังเริ่มกระบวนการสำรองข้อมูล (C:\ และ D:\)...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\backup-clean-system.ps1"

if %ERRORLEVEL% equ 0 (
    color 0A
) else (
    echo.
    echo ===================================================
    echo [X] เกิดข้อผิดพลาดระหว่างการสำรองข้อมูล!
    echo ===================================================
    color 0C
)

echo.
echo กดปุ่มใดๆ เพื่อปิดหน้าต่างนี้...
pause > nul
