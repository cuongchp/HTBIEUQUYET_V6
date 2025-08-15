@echo off
echo Restarting EVNCHP Voting System...
echo.
cd /d "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"

echo Killing existing processes...
taskkill /F /IM node.exe >nul 2>&1

echo Starting server with npm start...
npm start

pause
