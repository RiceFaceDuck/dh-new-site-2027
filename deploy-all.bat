@echo off

echo ===============================
echo BUILD FRONTEND
echo ===============================

cd dh-frontend
call npm run build

cd ..

echo ===============================
echo BUILD BACKOFFICE
echo ===============================

cd dh-backoffice-react
call npm run build

cd ..

echo ===============================
echo DEPLOY FIREBASE
echo ===============================

firebase deploy

echo ===============================
echo DEPLOY COMPLETE
echo ===============================

pause