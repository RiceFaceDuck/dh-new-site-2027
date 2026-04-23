@echo off
TITLE Deploying DH Notebook Frontend
echo --------------------------------------------------
echo [1/3] Entering Project Folder...
cd /d "C:\DH Notebook\Management System\dh-frontend"

echo [2/3] Building System (Vite + React)...
call npm run build

echo [3/3] Deploying to Firebase Hosting...
cd ..
call firebase deploy --only hosting:dh-notebook-frontend

echo --------------------------------------------------
echo ✅ Frontend Deployment Complete!
echo URL: https://dh-notebook-frontend.web.app
echo --------------------------------------------------
pause