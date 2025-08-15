@echo off
title He Thong Bieu Quyet - Development Mode
echo ================================
echo   DEVELOPMENT MODE - EVNCHP
echo ================================
echo.

REM Kiem tra Node.js
echo [1/4] Kiem tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js chua duoc cai dat!
    pause
    exit /b 1
)
echo ✅ Node.js: 
node --version

REM Cai dat dependencies
echo [2/4] Kiem tra dependencies...
if not exist "node_modules\" (
    echo 📦 Cai dat dependencies...
    npm install
) else (
    echo ✅ Dependencies da ton tai
)

REM Kiem tra nodemon
echo [3/4] Kiem tra nodemon...
npx nodemon --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Cai dat nodemon...
    npm install -g nodemon
)
echo ✅ Nodemon da san sang

REM Khoi chay development server
echo [4/4] Khoi chay development server...
echo.
echo 🔧 Development Mode (Auto-reload)
echo 🌐 Server: http://localhost:3000
echo 📝 File se tu dong reload khi thay doi
echo 📝 Nhan Ctrl+C de dung server
echo.
echo ================================
echo   DEVELOPMENT SERVER RUNNING
echo ================================

npm run dev

echo.
echo 🛑 Development server da dung
pause
