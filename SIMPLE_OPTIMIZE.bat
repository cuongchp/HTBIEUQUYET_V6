@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║     TỐI ƯU DỰ ÁN HTBIEUQUYET V6        ║
echo ╚══════════════════════════════════════════╝
echo.

echo [1/4] Tạo cấu trúc thư mục chuẩn...
if not exist "controllers" mkdir "controllers"
if not exist "models" mkdir "models"
if not exist "config" mkdir "config"
if not exist "public\css" mkdir "public\css"
if not exist "public\js\modules" mkdir "public\js\modules"
if not exist "public\images" mkdir "public\images"
if not exist "routes" mkdir "routes"
if not exist "services" mkdir "services"
if not exist "middleware" mkdir "middleware"
if not exist "database" mkdir "database"
if not exist "uploads\votes" mkdir "uploads\votes"
if not exist "uploads\drafts" mkdir "uploads\drafts"
if not exist "uploads\documents" mkdir "uploads\documents"
if not exist "docs" mkdir "docs"
if not exist "utils" mkdir "utils"
if not exist "logs" mkdir "logs"

echo [2/4] Tạo file .gitkeep...
echo. > "uploads\.gitkeep"
echo. > "uploads\votes\.gitkeep"
echo. > "uploads\drafts\.gitkeep"
echo. > "uploads\documents\.gitkeep"
echo. > "logs\.gitkeep"

echo [3/4] Xóa các file test và debug...
if exist "test*.js" del /q "test*.js"
if exist "debug*.js" del /q "debug*.js"
if exist "verify*.js" del /q "verify*.js"

echo [4/4] Tạo file .gitignore...
echo # Dependencies > .gitignore
echo node_modules/ >> .gitignore
echo npm-debug.log* >> .gitignore
echo. >> .gitignore
echo # Environment files >> .gitignore
echo .env >> .gitignore
echo .env.local >> .gitignore
echo. >> .gitignore
echo # Upload files >> .gitignore
echo uploads/* >> .gitignore
echo !uploads/.gitkeep >> .gitignore
echo !uploads/*/.gitkeep >> .gitignore
echo. >> .gitignore
echo # IDE >> .gitignore
echo .vscode/ >> .gitignore
echo .idea/ >> .gitignore
echo. >> .gitignore
echo # Backup folders >> .gitignore
echo backup_*/ >> .gitignore
echo. >> .gitignore
echo # Logs >> .gitignore
echo logs/ >> .gitignore
echo *.log >> .gitignore
echo. >> .gitignore
echo # Test files >> .gitignore
echo test_*.js >> .gitignore
echo debug_*.js >> .gitignore

echo.
echo ══════════════════════════════════════════
echo ✓ TỐI ƯU HOÀN TẤT!
echo.
echo Đã tạo cấu trúc thư mục chuẩn MVC
echo Đã tạo file .gitignore
echo.
pause
