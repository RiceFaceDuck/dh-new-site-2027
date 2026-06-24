@echo off
echo ========================================
echo     DH Hardware Scanner Compiler
echo ========================================

:: หาตำแหน่งของ C# Compiler ที่ติดมากับ Windows
set CSC_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe
if not exist "%CSC_PATH%" (
    set CSC_PATH=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe
)

echo [1/2] Compiling DH_Scanner.cs...
"%CSC_PATH%" /target:winexe /out:"DH Hardware Scanner.exe" /reference:System.Management.dll DH_Scanner.cs

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Compilation failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] Success! 
echo Created: "DH Hardware Scanner.exe"
echo.
echo You can now run "DH Hardware Scanner.exe" to test it.
pause
