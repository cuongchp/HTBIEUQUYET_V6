@echo off
chcp 65001 >nul
echo ===== KIỂM TRA AN TOÀN TRƯỚC KHI DỌN DẸP =====
echo.

:: Kiểm tra các file quan trọng
echo Kiểm tra các file core...
set MISSING_FILES=0

if not exist "server.js" (
    echo [LỖI] Không tìm thấy server.js
    set MISSING_FILES=1
)

if not exist "routes\admin.js" (
    echo [LỖI] Không tìm thấy routes\admin.js
    set MISSING_FILES=1
)

if not exist "routes\votes.js" (
    echo [LỖI] Không tìm thấy routes\votes.js  
    set MISSING_FILES=1
)

if not exist "public\index.html" (
    echo [LỖI] Không tìm thấy public\index.html
    set MISSING_FILES=1
)

:: Kiểm tra file drafts
echo.
echo Kiểm tra các phiên bản file drafts...
if exist "routes\drafts.js" echo [OK] routes\drafts.js
if exist "routes\drafts_backup.js" echo [Backup] routes\drafts_backup.js
if exist "routes\drafts_fixed.js" echo [Fixed] routes\drafts_fixed.js
if exist "public\js\modules\drafts.js" (
    for %%I in ("public\js\modules\drafts.js") do (
        if %%~zI==0 (
            echo [CẢNH BÁO] public\js\modules\drafts.js đang TRỐNG!
        ) else (
            echo [OK] public\js\modules\drafts.js - %%~zI bytes
        )
    )
)

echo.
if %MISSING_FILES%==1 (
    echo [CẢNH BÁO] Có file quan trọng bị thiếu!
    echo Vui lòng kiểm tra lại trước khi dọn dẹp.
    pause
    exit /b 1
)

echo Tất cả file core đều tồn tại.
echo.
echo Bạn có muốn tiếp tục dọn dẹp? (Y/N)
choice /C YN /M "Lựa chọn"
if errorlevel 2 exit /b

:: Chạy cleanup script
call cleanup-project.bat

pause