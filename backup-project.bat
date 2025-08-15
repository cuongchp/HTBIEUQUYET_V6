@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║       BACKUP DỰ ÁN HTBIEUQUYET V6       ║
echo ╚══════════════════════════════════════════╝
echo.

:: Tạo thư mục backup với timestamp
set "timestamp=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "timestamp=%timestamp: =0%"
set "backupFolder=backup_%timestamp%"
echo Đang tạo backup vào thư mục: %backupFolder%
mkdir "%backupFolder%" 2>nul

:: Sao chép tất cả file vào thư mục backup
xcopy /s /i /y /q * "%backupFolder%\" /EXCLUDE:backup-exclude.txt
echo.
echo ✅ Hoàn tất backup!
echo Tất cả file đã được sao chép vào thư mục: %backupFolder%
echo.
pause
