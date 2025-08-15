@echo off
title He Thong Bieu Quyet - EVNCHP
echo ================================
echo    HE THONG BIEU QUYET EVNCHP
echo ================================
echo.

REM Kiem tra Node.js
echo [1/5] Kiem tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js chua duoc cai dat!
    echo Vui long cai dat Node.js tu https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js da san sang

REM Kiem tra npm
echo [2/5] Kiem tra npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm khong kha dung!
    pause
    exit /b 1
)
echo ✅ npm da san sang

REM Cai dat dependencies neu can
echo [3/5] Kiem tra dependencies...
if not exist "node_modules\" (
    echo 📦 Cai dat dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Loi khi cai dat dependencies!
        pause
        exit /b 1
    )
    echo ✅ Dependencies da duoc cai dat
) else (
    echo ✅ Dependencies da ton tai
)

REM Kiem tra file .env
echo [4/5] Kiem tra cau hinh...
if not exist ".env" (
    echo ⚠️  File .env khong ton tai, tao file mau...
    copy ".env.example" ".env" >nul 2>&1
    if not exist ".env" (
        echo Tao file .env mau...
        echo # Database Configuration > .env
        echo DB_SERVER=localhost >> .env
        echo DB_DATABASE=VotingSystem >> .env
        echo DB_USER=sa >> .env
        echo DB_PASSWORD=yourpassword >> .env
        echo DB_PORT=1433 >> .env
        echo. >> .env
        echo # Server Configuration >> .env
        echo PORT=3000 >> .env
        echo NODE_ENV=development >> .env
        echo. >> .env
        echo # Session Secret >> .env
        echo SESSION_SECRET=your-secret-key-here >> .env
    )
    echo ⚠️  Vui long cap nhat thong tin database trong file .env
)
echo ✅ Cau hinh da san sang

REM Khoi chay server
echo [5/5] Khoi chay server...
echo.
echo 🚀 Dang khoi chay He Thong Bieu Quyet...
echo 🌐 Server se chay tai: http://localhost:3000
echo 📝 Nhan Ctrl+C de dung server
echo.
echo ================================
echo    SERVER DANG CHAY
echo ================================

npm start

REM Neu server dung, hien thi thong bao
echo.
echo 🛑 Server da dung
pause
