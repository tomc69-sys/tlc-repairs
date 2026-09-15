@echo off
title TLC PC Repairs - Reviews Editor (local)
set SITE=%~dp0
set PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe
set URL=http://127.0.0.1:8891/

if not exist "%PY%" (
  echo Python 3.12 not found.
  pause
  exit /b 1
)

netstat -ano | findstr ":8891 " | findstr LISTENING >nul
if errorlevel 1 (
  echo Starting Reviews editor on port 8891...
  start "TLC Reviews Editor" /MIN cmd /c "cd /d "%SITE%" && "%PY%" tools\reviews_editor_server.py"
  timeout /t 2 /nobreak >nul
) else (
  echo Editor server already running on port 8891.
)

echo.
echo  TLC Reviews Editor - LOCAL APPROVE
echo  Open: %URL%
echo.
echo  1. Paste emailed reviews into Add pending, or test the site form
echo  2. Approve or reject
echo  3. Run deploy-reviews.bat to go live
echo.
start "" "%URL%"
pause
