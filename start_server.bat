@echo off
echo ============================================
echo HTBIEUQUYET_V6 - SOFT DELETE SYSTEM
echo ============================================
echo.
echo Checking Node.js version...
node --version
echo.
echo Checking npm version...
npm --version
echo.
echo Installing dependencies...
npm install
echo.
echo Starting server...
npm start
echo.
echo Server failed to start. Press any key to exit...
pause
