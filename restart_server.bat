@echo off
echo Dang dung server cu...
taskkill /F /IM node.exe >nul 2>&1
echo Cho 3 giay...
timeout /t 3 >nul
echo Khoi dong server moi...
cd "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"
start "EVNCHP Server" node server.js
echo Server da khoi dong!
echo Mo http://localhost:3000 trong trinh duyet
timeout /t 2 >nul
