@echo off
title Setup Database - He Thong Bieu Quyet
echo ================================
echo    SETUP DATABASE - EVNCHP
echo ================================
echo.

echo [1/3] Kiem tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js chua duoc cai dat!
    pause
    exit /b 1
)
echo ✅ Node.js da san sang

echo [2/3] Kiem tra dependencies...
if not exist "node_modules\" (
    echo 📦 Cai dat dependencies...
    npm install
)

echo [3/3] Thiet lap database...
echo.
echo 🗄️  Dang thiet lap database...
echo ⚠️  Dam bao SQL Server dang chay va thong tin ket noi trong .env chinh xac
echo.

REM Chay script setup database
if exist "setup-db.js" (
    echo 📋 Chay script setup database...
    node setup-db.js
) else (
    echo ❌ Khong tim thay file setup-db.js
)

echo.
echo 🔐 Thiet lap permissions...
if exist "setup-permissions.js" (
    node setup-permissions.js
) else if exist "insert-permissions.js" (
    node insert-permissions.js
) else (
    echo ⚠️  Khong tim thay script permissions
)

echo.
echo ✅ Database setup hoan tat!
echo 📝 Neu co loi, kiem tra lai thong tin ket noi database trong file .env
pause
