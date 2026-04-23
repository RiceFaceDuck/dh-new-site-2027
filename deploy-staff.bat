@echo off
TITLE Deploying DH Notebook Staff App
echo --------------------------------------------------
echo [1/3] Entering Project Folder...
cd /d "C:\DH Notebook\Management System\dh-staff-app"

echo [2/3] Building System (Vite + React)...
call npm run build

echo [3/3] Deploying to Firebase Hosting...
cd ..
call firebase deploy --only hosting:dh-notebook-69f3b

echo --------------------------------------------------
echo ✅ Staff App Deployment Complete!
echo URL: https://dh-notebook-69f3b.web.app
echo --------------------------------------------------
pause