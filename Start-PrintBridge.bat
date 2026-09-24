@echo off
title PrintHub Print Bridge
color 0A
cls
echo ====================================================================
echo        PrintHub Local Print Bridge - Desktop Connector
echo ====================================================================
echo.
echo Initializing local print listener on port 1337...
echo.

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js runtime detected.
    echo Starting PrintHub Bridge (Node.js engine)...
    echo.
    node "%~dp0print-bridge.js"
) else (
    echo [INFO] Node.js not detected on this system.
    echo Launching native Windows PowerShell bridge (Zero-Dependency)...
    echo.
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0print-bridge.ps1"
)

echo.
echo ====================================================================
echo Print Bridge process ended. Press any key to exit.
echo ====================================================================
pause >nul
