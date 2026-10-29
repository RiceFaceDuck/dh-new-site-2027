@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title Deploying Cloud Functions (Safe Mode)
cd /d "%~dp0\.."

echo ==================================================
echo   ☁️ CLOUD FUNCTIONS DEPLOYMENT (SAFE MODE)
echo ==================================================
echo [คำเตือน] เพื่อความปลอดภัยสูงสุด ป้องกัน Firebase CLI ลบ 14 ฟังก์ชันเดิมบน Cloud
echo ระบบจะบังคับให้ Deploy เจาะจงรายฟังก์ชันเท่านั้น
echo --------------------------------------------------
echo ตัวอย่างชื่อฟังก์ชันที่ใช้บ่อย:
echo   - recordAdTelemetry
echo   - verifySlipOcr,purgeOldSlips
echo   - partnerVisibilitySync
echo   - ga4AdSyncCron,ga4AdSyncManual
echo   - nightlyChunkGuard
echo --------------------------------------------------
set /p FN_NAME="ระบุชื่อฟังก์ชันที่ต้องการ Deploy (หรือพิมพ์ all ถ้าต้องการเหมารวม): "

if "%FN_NAME%"=="" (
    echo.
    echo ❌ ไม่ได้ระบุชื่อฟังก์ชัน! ยกเลิกการ Deploy เพื่อความปลอดภัย
    pause
    exit /b 1
)

if /i "%FN_NAME%"=="all" (
    echo.
    echo ⚠️ คุณเลือก Deploy เหมารวมทั้งระบบ!
    set /p CONFIRM="ยืนยันหรือไม่? (พิมพ์ YES เพื่อยืนยัน): "
    if not "!CONFIRM!"=="YES" (
        echo.
        echo ยกเลิกการ Deploy เหมารวม ปลอดภัย 100%
        pause
        exit /b 0
    )
    call firebase deploy --only functions
) else (
    echo.
    echo กำลัง Deploy: functions:%FN_NAME% ...
    call firebase deploy --only functions:%FN_NAME%
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ [ERROR] Deployment ล้มเหลว!
    pause
    exit /b 1
)

echo.
echo ==================================================
echo ✅ Cloud Functions Deployment Complete!
echo ==================================================
pause
