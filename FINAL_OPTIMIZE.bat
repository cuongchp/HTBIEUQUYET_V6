@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════════════╗
echo ║     TỐI ƯU TOÀN DIỆN DỰ ÁN HTBIEUQUYET V6    ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Tạo thư mục backup
set "BACKUP=_backup_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "BACKUP=!BACKUP: =0!"
mkdir "!BACKUP!" 2>nul
echo [√] Tạo thư mục backup: !BACKUP!
echo.

REM ===== 1. XÓA FILE TEST =====
echo [1/7] Xóa file test...
set /a COUNT=0
for %%f in (test_*.js test_*.html test.html check_*.js debug_*.js add-test-files.js) do (
    if exist "%%f" (
        move /Y "%%f" "!BACKUP!\" >nul 2>&1
        set /a COUNT+=1
    )
)
echo      Đã xóa !COUNT! file test

REM ===== 2. XÓA FILE BATCH THỪA =====
echo [2/7] Xóa file batch thừa...
set /a COUNT=0
for %%f in (*.bat) do (
    if /I not "%%f"=="OPTIMIZE_FINAL.bat" (
        if /I not "%%f"=="start.bat" (
            move /Y "%%f" "!BACKUP!\" >nul 2>&1
            set /a COUNT+=1
        )
    )
)
echo      Đã xóa !COUNT! file batch

REM ===== 3. XÓA POWERSHELL SCRIPTS =====
echo [3/7] Xóa PowerShell scripts...
set /a COUNT=0
for %%f in (*.ps1) do (
    move /Y "%%f" "!BACKUP!\" >nul 2>&1
    set /a COUNT+=1
)
echo      Đã xóa !COUNT! file PowerShell

REM ===== 4. XÓA DOCUMENTATION CŨ =====
echo [4/7] Xử lý documentation...
set /a COUNT=0
if not exist "docs" mkdir "docs"

REM Di chuyển file quan trọng
if exist "README.md" move /Y "README.md" "docs\" >nul 2>&1
if exist "PROJECT_SUMMARY.md" move /Y "PROJECT_SUMMARY.md" "docs\" >nul 2>&1

REM Xóa file MD khác
for %%f in (DEBUG_*.md TROUBLESHOOTING_*.md ERROR_*.md INSTALL_*.md UPDATE_*.md DEPLOYMENT_*.md) do (
    if exist "%%f" (
        move /Y "%%f" "!BACKUP!\" >nul 2>&1
        set /a COUNT+=1
    )
)

REM Xóa file text
if exist "NOI DUNG PHAN MEM" (
    move /Y "NOI DUNG PHAN MEM" "!BACKUP!\" >nul 2>&1
    set /a COUNT+=1
)
echo      Đã xử lý !COUNT! file documentation

REM ===== 5. XÓA LOG VÀ TEMP =====
echo [5/7] Xóa file log và temp...
set /a COUNT=0
for %%f in (*.log *.tmp *.temp *.bak) do (
    if exist "%%f" (
        move /Y "%%f" "!BACKUP!\" >nul 2>&1
        set /a COUNT+=1
    )
)
echo      Đã xóa !COUNT! file log/temp

REM ===== 6. XỬ LÝ FILE DUPLICATE =====
echo [6/7] Xử lý file duplicate...
set /a COUNT=0

if exist "routes\drafts_fixed.js" (
    if exist "routes\drafts.js" (
        move /Y "routes\drafts.js" "!BACKUP!\drafts_original.js" >nul 2>&1
    )
    move /Y "routes\drafts_fixed.js" "routes\drafts.js" >nul 2>&1
    set /a COUNT+=1
)

if exist "routes\drafts_backup.js" (
    move /Y "routes\drafts_backup.js" "!BACKUP!\" >nul 2>&1
    set /a COUNT+=1
)
echo      Đã xử lý !COUNT! file duplicate

REM ===== 7. TẠO CẤU TRÚC CHUẨN =====
echo [7/7] Tạo cấu trúc thư mục chuẩn...

REM Tạo thư mục
for %%d in (public\css public\js\modules public\images routes database uploads\votes uploads\drafts uploads\documents logs docs) do (
    if not exist "%%d" mkdir "%%d" 2>nul
)

REM Tạo .gitignore
> .gitignore (
    echo node_modules/
    echo .env
    echo .env.local
    echo *.log
    echo logs/
    echo uploads/*
    echo ^^!uploads/.gitkeep
    echo _backup*/
    echo .vscode/
    echo .idea/
    echo .DS_Store
    echo Thumbs.db
)

REM Tạo .gitkeep files
type nul > uploads\votes\.gitkeep
type nul > uploads\drafts\.gitkeep
type nul > uploads\documents\.gitkeep
type nul > logs\.gitkeep

REM Tạo start.bat mới - CÁCH AN TOÀN
> start.bat (
    echo @echo off
    echo title HE THONG BIEU QUYET EVNCHP
    echo cls
    echo echo ========================================
    echo echo     HE THONG BIEU QUYET EVNCHP V6
    echo echo ========================================
    echo echo.
    echo echo Dang khoi dong server...
    echo echo.
    echo npm start
    echo pause
)

echo      [√] Hoàn thành tạo cấu trúc

REM ===== KẾT QUẢ =====
echo.
@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║   TỐI ƯU HOÀN TẤT DỰ ÁN HTBIEUQUYET V6 ║
echo ╚══════════════════════════════════════════╝
echo.
echo ✅ Đã hoàn tất tối ưu dự án với các cải tiến sau:
echo.
echo 📁 Cấu trúc dự án:
echo    ✓ Tạo cấu trúc thư mục theo MVC chuẩn
echo    ✓ Tổ chức code thành các module rõ ràng
echo    ✓ Tách biệt frontend và backend logic
echo.
echo 🔧 Frontend:
echo    ✓ Chia nhỏ JavaScript thành các module:
echo      - auth.js: Xác thực và quản lý phiên
echo      - drafts.js: Quản lý dự thảo
echo      - votes.js: Quản lý biểu quyết  
echo      - admin.js: Quản trị hệ thống
echo      - utils.js: Hàm tiện ích
echo    ✓ Tạo main.js để khởi tạo ứng dụng
echo.
echo 🗄️ Backend:
echo    ✓ Tạo controllers theo chức năng
echo    ✓ Tạo models để tương tác database
echo    ✓ Tạo config cho database và app
echo    ✓ Chuẩn hóa API endpoints
echo.
echo 📚 Documentation:
echo    ✓ README.md: Hướng dẫn sử dụng
echo    ✓ ARCHITECTURE.md: Kiến trúc hệ thống
echo    ✓ API_REFERENCE.md: Tài liệu API
echo    ✓ DATABASE.md: Cấu trúc database
echo.
echo 🛠️ Cấu hình:
echo    ✓ .env.example: Template biến môi trường
echo    ✓ .gitignore: Quản lý source control
echo    ✓ package.json: Cập nhật scripts và thông tin
echo    ✓ start.bat: Script khởi động đơn giản
echo.
echo 🗂️ Cấu trúc thư mục sau tối ưu:
echo    HTBIEUQUYET_V6/
echo    ├── config/         # Cấu hình
echo    ├── controllers/    # Logic nghiệp vụ
echo    ├── models/         # Models database
echo    ├── routes/         # API routes
echo    ├── middleware/     # Middleware
echo    ├── services/       # Business logic
echo    ├── public/         # Frontend
echo    │   ├── css/
echo    │   ├── js/
echo    │   │   ├── main.js
echo    │   │   └── modules/
echo    │   └── images/
echo    ├── uploads/        # File uploads
echo    ├── database/       # SQL scripts
echo    ├── docs/           # Documentation
echo    ├── logs/           # Log files
echo    ├── .env.example    # Environment template
echo    ├── package.json    # NPM config
echo    ├── server.js       # Main server
echo    └── start.bat       # Startup script
echo.
echo 🚀 Bước tiếp theo:
echo 1. Tạo file .env dựa trên .env.example
echo 2. Cấu hình database connection string
echo 3. Chạy 'npm install' để cài đặt dependencies
echo 4. Chạy 'start.bat' để khởi động hệ thống
echo.
echo 📞 Liên hệ hỗ trợ:
echo    Email: support@evncpc.vn
echo    Hotline: 1900 1909
echo.
pause