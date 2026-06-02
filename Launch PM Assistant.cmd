@echo off
title PM Assistant
cd /d "%~dp0"

REM ── First run: install deps + build the app (only happens once) ─────────────
if not exist "node_modules" (
  echo Installing PM Assistant for the first time. This runs once...
  call npm install
)
if not exist "dist\index.html" (
  echo Building PM Assistant...
  call npm run build
)

REM ── Start the local server (own window, minimized) and open the browser ─────
echo Starting PM Assistant...
start "PM Assistant server" /min cmd /c "npm run preview"

REM give the server a second to come up, then open the app
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo  PM Assistant is running at  http://localhost:5173
echo  Your data stays on this PC and is loaded automatically.
echo.
echo  Leave the small minimized "PM Assistant server" window running while you
echo  use the app. Closing it stops the server.
echo.
echo  (To refresh after a code update, delete the "dist" folder and relaunch.)
timeout /t 4 /nobreak >nul
