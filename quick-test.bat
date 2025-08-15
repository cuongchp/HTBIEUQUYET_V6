@echo off
title Quick Fix & Test Draft Features
echo ============================================
echo   FIXING & TESTING DRAFT FEATURES
echo ============================================
echo.

echo [1] Checking current directory...
cd /d "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"
echo Current dir: %CD%

echo.
echo [2] Killing any existing node processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo [3] Starting server...
start "HTBIEUQUYET Server" cmd /k "echo Starting server... && npm start"

echo.
echo [4] Waiting for server startup...
timeout /t 8 /nobreak >nul

echo.
echo [5] Opening debug pages...
start http://localhost:3000/debug-functions.html
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo ============================================
echo   WHAT TO CHECK:
echo ============================================
echo 1. Debug page should show green checkmarks
echo 2. Main app: Login as admin
echo 3. Go to "Dự thảo tờ trình" section  
echo 4. Check if edit/delete buttons appear
echo 5. No console errors should appear
echo ============================================
echo.
echo Press any key to close this window...
pause >nul
