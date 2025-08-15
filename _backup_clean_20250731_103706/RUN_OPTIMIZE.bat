@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║     TỐI ƯU DỰ ÁN HTBIEUQUYET V6        ║
echo ╚══════════════════════════════════════════╝
echo.
echo Đang thực hiện tối ưu tự động...
echo.

:: Chạy PowerShell script
powershell -ExecutionPolicy Bypass -File "optimize-project.ps1"

echo.
echo ══════════════════════════════════════════
echo Hoàn thành! Nhấn phím bất kỳ để đóng.
pause >nul