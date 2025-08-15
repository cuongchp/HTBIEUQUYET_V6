@echo off
echo ===========================================
echo    HE THONG BIEU QUYET EVNCHP - SECURE    
echo ===========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js first
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version

echo.
echo [INFO] Starting secure EVNCHP Voting System...
echo [INFO] Environment: %NODE_ENV%
echo [INFO] Port: %PORT%
echo.

REM Create logs directory if not exists
if not exist "logs" mkdir logs

REM Start the secure server
echo [INFO] Loading secure server configuration...
node server_secure.js

pause
