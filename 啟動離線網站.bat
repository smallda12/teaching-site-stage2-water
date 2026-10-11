@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "PORT=8761"
where py >nul 2>&1
if not errorlevel 1 set "PY_CMD=py -3"
if not defined PY_CMD (
  where python >nul 2>&1
  if not errorlevel 1 set "PY_CMD=python"
)
if not defined PY_CMD (
  echo Python 3 was not found. Ask your IT administrator to start a local Python HTTP server.
  pause
  exit /b 1
)
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:%PORT%/index.html'"
echo Serving this site on 127.0.0.1:%PORT%. Keep this window open.
echo Press Ctrl+C to stop the local server.
%PY_CMD% -m http.server %PORT% --bind 127.0.0.1
