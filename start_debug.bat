@echo off
echo.
echo ==========================================
echo   STARTING HTBIEUQUYET_V6 SERVER - DEBUG
echo ==========================================
echo.

cd /d "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"

echo Current directory: %CD%
echo.

echo Checking Node.js...
node --version
echo.

echo Checking npm...
npm --version
echo.

echo Installing dependencies (if needed)...
npm install
echo.

echo Starting server in debug mode...
echo Press Ctrl+C to stop the server
echo.
echo ==========================================
echo Server starting on http://localhost:3000
echo ==========================================
echo.

node server.js

echo.
echo Server stopped. Press any key to exit...
pause > nul
