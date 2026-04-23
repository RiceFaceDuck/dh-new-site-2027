@echo off
TITLE Deploying DH Notebook Backoffice
echo --------------------------------------------------
echo [1/3] Entering Project Folder...
:: ตรวจสอบว่า Path ถูกต้องตามโครงสร้างจริง 
cd /d "C:\DH Notebook\Management System\dh-backoffice-react"

echo [2/3] Building System (Vite + React)...
call npm run build

echo [3/3] Deploying to Firebase Hosting...
:: ย้ายออกมาที่ root เพื่อใช้ไฟล์ firebase.json 
cd ..
:: สำคัญ: ห้ามมีช่องว่างหลังเครื่องหมาย : 
call firebase deploy --only hosting:dhnotebook-work

echo --------------------------------------------------
echo ✅ Done!
echo --------------------------------------------------
pause