@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║   TỐI ƯU DỰ ÁN HTBIEUQUYET V6 - MENU   ║
echo ╚══════════════════════════════════════════╝
echo.
echo  [1] Backup dự án trước khi tối ưu
echo  [2] Xóa file không cần thiết và tổ chức thư mục
echo  [3] Tái cấu trúc frontend
echo  [4] Tối ưu backend
echo  [5] Tạo documentation
echo  [6] Thực hiện tất cả các bước (1-5)
echo  [0] Thoát
echo.
echo ══════════════════════════════════════════

choice /c 1234560 /n /m "Chọn tùy chọn (0-6): "

if errorlevel 7 goto exit
if errorlevel 6 goto all
if errorlevel 5 goto docs
if errorlevel 4 goto backend
if errorlevel 3 goto frontend
if errorlevel 2 goto cleanup
if errorlevel 1 goto backup

:backup
call backup-project.bat
goto menu

:cleanup
echo.
echo ╔══════════════════════════════════════════╗
echo ║     ĐANG XÓA FILE KHÔNG CẦN THIẾT       ║
echo ╚══════════════════════════════════════════╝
echo.
call RUN_OPTIMIZE.bat
goto menu

:frontend
echo.
echo ╔══════════════════════════════════════════╗
echo ║        ĐANG TỐI ƯU FRONTEND             ║
echo ╚══════════════════════════════════════════╝
echo.
call optimize-frontend.bat
goto menu

:backend
echo.
echo ╔══════════════════════════════════════════╗
echo ║         ĐANG TỐI ƯU BACKEND             ║
echo ╚══════════════════════════════════════════╝
echo.
call optimize-backend.bat
goto menu

:docs
echo.
echo ╔══════════════════════════════════════════╗
echo ║      ĐANG TẠO DOCUMENTATION             ║
echo ╚══════════════════════════════════════════╝
echo.
call create-docs.bat
goto menu

:all
call backup-project.bat
call RUN_OPTIMIZE.bat
call optimize-frontend.bat
call optimize-backend.bat
call create-docs.bat
echo.
echo ╔══════════════════════════════════════════╗
echo ║   TỐI ƯU HOÀN TẤT - TẤT CẢ CÁC BƯỚC    ║
echo ╚══════════════════════════════════════════╝
echo.
goto end

:menu
echo.
echo Nhấn phím bất kỳ để quay lại menu...
pause >nul
cls
goto :eof

:exit
exit /b

:end
echo Nhấn phím bất kỳ để thoát...
pause >nul
