@echo off
echo ================================================
echo    HE THONG BIEU QUYET EVNCHP - KHOI DONG
echo ================================================
echo.

cd /d "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"

echo [1] Kiem tra Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js chua duoc cai dat!
    pause
    exit /b 1
)

echo [2] Kiem tra dependencies...
if not exist node_modules (
    echo Cai dat dependencies...
    npm install
)

echo [3] Tao thu muc uploads...
if not exist uploads mkdir uploads
if not exist uploads\votes mkdir uploads\votes
if not exist uploads\drafts mkdir uploads\drafts
if not exist uploads\documents mkdir uploads\documents

echo.
echo [4] KHOI DONG SERVER...
echo ================================================
echo  Server dang chay tai: http://localhost:3000
echo.
echo  TAI KHOAN DANG NHAP:
echo  - Admin: admin / admin123 (Quan tri vien)
echo  - Thu ky: thuky / thuky123 (Thu ky Hoi dong)
echo  - Chu tich: chutich / chutich123 (Chu tich)
echo  - Thanh vien: thanhvien1 / tv123 (Thanh vien)
echo.
echo  Nhan Ctrl+C de dung server
echo ================================================

node server.js
