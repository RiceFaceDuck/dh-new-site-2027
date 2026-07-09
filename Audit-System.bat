@echo off
echo ===================================================
echo     DH Notebook - Deep Stability Audit Scripts
echo ===================================================
echo.
echo Running JavaScript Logic Audit...
node scripts/deep_stability_audit.js
echo.
echo Running React Memory Leak Audit...
node scripts/deep_react_audit.js
echo.
echo ===================================================
echo Audit Complete!
pause
