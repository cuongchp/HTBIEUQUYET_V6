@echo off
title System Check - He Thong Bieu Quyet
echo ================================
echo    SYSTEM CHECK - EVNCHP
echo ================================
echo.

echo 🔍 Kiem tra he thong...
echo.

REM Check Node.js
echo [1/7] Node.js:
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Chua cai dat
) else (
    echo ✅ 
    node --version
)

REM Check npm
echo [2/7] npm:
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Khong kha dung
) else (
    echo ✅ 
    npm --version
)

REM Check dependencies
echo [3/7] Dependencies:
if exist "node_modules\" (
    echo ✅ Da cai dat
) else (
    echo ❌ Chua cai dat
)

REM Check .env file
echo [4/7] File cau hinh .env:
if exist ".env" (
    echo ✅ Ton tai
) else (
    echo ❌ Khong ton tai
)

REM Check main files
echo [5/7] File chinh:
if exist "server.js" (
    echo ✅ server.js ton tai
) else (
    echo ❌ server.js khong ton tai
)

if exist "package.json" (
    echo ✅ package.json ton tai
) else (
    echo ❌ package.json khong ton tai
)

REM Check database files
echo [6/7] Database scripts:
if exist "setup-db.js" (
    echo ✅ setup-db.js ton tai
) else (
    echo ⚠️  setup-db.js khong ton tai
)

if exist "database\" (
    echo ✅ Thu muc database ton tai
) else (
    echo ⚠️  Thu muc database khong ton tai
)

REM Check public files
echo [7/7] Static files:
if exist "public\" (
    echo ✅ Thu muc public ton tai
) else (
    echo ❌ Thu muc public khong ton tai
)

if exist "uploads\" (
    echo ✅ Thu muc uploads ton tai
) else (
    echo ⚠️  Thu muc uploads khong ton tai - se tu tao khi can
)

echo.
echo ================================
echo        KET QUA KIEM TRA
echo ================================

REM Test database connection
echo.
echo 🔗 Test ket noi database...
if exist "test-db.js" (
    node test-db.js
) else if exist "test_database.js" (
    node test_database.js
) else (
    echo ⚠️  Khong tim thay script test database
)

echo.
echo 📋 Kiem tra hoan tat!
pause
