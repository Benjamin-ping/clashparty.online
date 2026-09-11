@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\upload.ps1"
set "UPLOAD_EXIT=%ERRORLEVEL%"
echo.
pause
exit /b %UPLOAD_EXIT%
