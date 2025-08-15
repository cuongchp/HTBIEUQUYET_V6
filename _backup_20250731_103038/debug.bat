@echo off
echo ================================================
echo    HE THONG BIEU QUYET EVNCHP - DEBUG VERSION
echo ================================================
echo.

echo [1/3] Kiem tra Node.js va files...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js chua duoc cai dat!
    pause
    exit /b 1
)

echo [2/3] Test syntax...
node -c server.js
if %errorlevel% neq 0 (
    echo ERROR: Loi syntax trong server.js!
    pause
    exit /b 1
)

echo [3/3] Khoi dong server...
echo.
echo DEBUG ENDPOINTS sau khi dang nhap:
echo - http://localhost:3000/api/debug/admin-routes
echo - http://localhost:3000/api/debug/permissions 
echo - http://localhost:3000/api/test-db
echo.
echo Server khoi dong tai http://localhost:3000
echo Nhan Ctrl+C de dung server
echo ================================================

node server.js

pause
