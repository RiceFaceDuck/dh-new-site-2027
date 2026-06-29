@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo  DH NOTEBOOK - FULL DEPLOYMENT SCRIPT
echo ========================================================
echo.

:: 1. Build Frontend
echo [*] Building dh-frontend...
cd dh-frontend
call npm run build
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [ERROR] Frontend build failed! Aborting deployment.
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Frontend build complete.
echo.

:: 2. Build Backoffice
echo [*] Building dh-backoffice-react...
cd dh-backoffice-react
call npm run build
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [ERROR] Backoffice build failed! Aborting deployment.
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Backoffice build complete.
echo.

:: 3. Build Staff App
echo [*] Building dh-staff-app...
cd dh-staff-app
call npm run build
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [ERROR] Staff App build failed! Aborting deployment.
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Staff App build complete.
echo.

:: 4. Deploy to Firebase
echo [*] Deploying to Firebase...
call firebase deploy
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [ERROR] Firebase deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo  [SUCCESS] All systems built and deployed successfully!
echo ========================================================
echo.
pause