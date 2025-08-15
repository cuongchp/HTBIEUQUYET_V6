@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║     TỐI ƯU DỰ ÁN HTBIEUQUYET V6        ║
echo ╚══════════════════════════════════════════╝
echo.
echo Đang thực hiện tối ưu tự động...
echo.

:: Tạo thư mục backup
set "backupFolder=backup_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "backupFolder=%backupFolder: =0%"
echo [1/5] Tạo thư mục backup: %backupFolder%
mkdir "%backupFolder%" 2>nul
echo.

:: Tạo cấu trúc thư mục chuẩn
echo [2/5] Tạo cấu trúc thư mục chuẩn...
mkdir "controllers" 2>nul
mkdir "models" 2>nul
mkdir "config" 2>nul
mkdir "public\css" 2>nul
mkdir "public\js\modules" 2>nul
mkdir "public\images" 2>nul
mkdir "public\fonts" 2>nul
mkdir "routes" 2>nul
mkdir "services" 2>nul
mkdir "middleware" 2>nul
mkdir "database" 2>nul
mkdir "uploads\votes" 2>nul
mkdir "uploads\drafts" 2>nul
mkdir "uploads\documents" 2>nul
mkdir "uploads\temp" 2>nul
mkdir "docs" 2>nul
mkdir "utils" 2>nul
mkdir "logs" 2>nul

:: Tạo file .gitkeep trong các thư mục uploads
echo. > "uploads\.gitkeep"
echo. > "uploads\votes\.gitkeep"
echo. > "uploads\drafts\.gitkeep"
echo. > "uploads\documents\.gitkeep"
echo. > "uploads\temp\.gitkeep"
echo. > "logs\.gitkeep"
echo.

:: Backup và xóa các file test và debug
echo [3/5] Xóa các file không cần thiết...
set deletedCount=0

for %%i in (
  test*.js test*.bat test*.html *_test.js 
  debug*.js debug*.bat debug*.html 
  verify*.js verify*.bat
  fix-*.bat fix_*.js fix_*.bat
  *_secure.js *_enhanced.js *_consolidated.js *_backup.js
  ADMIN_*.md CONSOLIDATION_*.md DRAFT_*.md FRONTEND_*.md
  PERFORMANCE_*.md README_*.md SCRIPTS_*.md SECURITY_*.md SERVER_*.md SOFT_DELETE_*.md
  reset*.js reset*.bat
  check*.bat monitor.bat menu.bat launch*.bat 
  move*.bat performance*.bat backup*.bat
) do (
  for /f %%j in ('dir /b /s "%%i" 2^>nul') do (
    echo   - Backup: %%j
    copy "%%j" "%backupFolder%\%%~nxj" >nul
    del "%%j"
    set /a deletedCount+=1
  )
)

echo.
echo Đã xóa %deletedCount% file không cần thiết.
echo.

:: Hợp nhất các file server
echo [4/5] Hợp nhất các file server...
if exist server_consolidated.js (
  copy server_consolidated.js "%backupFolder%\server_consolidated.js" >nul
  copy server_consolidated.js server.js >nul
  del server_consolidated.js
  echo   ✓ Đã sử dụng server_consolidated.js làm server chính
) else if exist server_enhanced.js (
  copy server_enhanced.js "%backupFolder%\server_enhanced.js" >nul
  copy server_enhanced.js server.js >nul
  del server_enhanced.js
  echo   ✓ Đã sử dụng server_enhanced.js làm server chính
) else if exist server_secure.js (
  copy server_secure.js "%backupFolder%\server_secure.js" >nul
  copy server_secure.js server.js >nul
  del server_secure.js
  echo   ✓ Đã sử dụng server_secure.js làm server chính
) else if exist server.js (
  echo   ✓ Đã giữ nguyên server.js hiện tại
) else (
  echo   ✗ Không tìm thấy file server.js nào!
)

:: Tạo file .gitignore
echo [5/5] Tạo file .gitignore và documentation...
echo # Dependencies > .gitignore
echo node_modules/ >> .gitignore
echo npm-debug.log* >> .gitignore
echo yarn-debug.log* >> .gitignore
echo yarn-error.log* >> .gitignore
echo. >> .gitignore
echo # Environment files >> .gitignore
echo .env >> .gitignore
echo .env.local >> .gitignore
echo .env.development.local >> .gitignore
echo .env.test.local >> .gitignore
echo .env.production.local >> .gitignore
echo. >> .gitignore
echo # Upload files >> .gitignore
echo uploads/* >> .gitignore
echo !uploads/.gitkeep >> .gitignore
echo !uploads/*/.gitkeep >> .gitignore
echo. >> .gitignore
echo # IDE >> .gitignore
echo .vscode/ >> .gitignore
echo .idea/ >> .gitignore
echo *.swp >> .gitignore
echo *.swo >> .gitignore
echo *~ >> .gitignore
echo. >> .gitignore
echo # OS >> .gitignore
echo .DS_Store >> .gitignore
echo Thumbs.db >> .gitignore
echo desktop.ini >> .gitignore
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
echo check_*.js >> .gitignore
echo debug_*.js >> .gitignore
echo *_test.js >> .gitignore
echo *_debug.js >> .gitignore
echo. >> .gitignore
echo # Temporary files >> .gitignore
echo temp/ >> .gitignore
echo tmp/ >> .gitignore
echo *.tmp >> .gitignore
echo *.temp >> .gitignore
echo. >> .gitignore
echo # Build output >> .gitignore
echo dist/ >> .gitignore
echo build/ >> .gitignore
echo. >> .gitignore
echo # Database files >> .gitignore
echo *.mdf >> .gitignore
echo *.ldf >> .gitignore
echo *.bak >> .gitignore

:: Tạo file start.bat đơn giản
echo @echo off > start.bat
echo chcp 65001 ^>nul >> start.bat
echo cls >> start.bat
echo echo ╔══════════════════════════════════════════╗ >> start.bat
echo echo ║   HỆ THỐNG BIỂU QUYẾT ĐIỆN TỬ EVNCHP    ║ >> start.bat
echo echo ║              Phiên bản 6.0               ║ >> start.bat
echo echo ╚══════════════════════════════════════════╝ >> start.bat
echo echo. >> start.bat
echo echo Đang khởi động server... >> start.bat
echo echo. >> start.bat
echo node server.js >> start.bat
echo pause >> start.bat

:: Tạo file README.md trong thư mục docs
echo # HỆ THỐNG BIỂU QUYẾT ĐIỆN TỬ EVNCHP V6 > docs\README.md
echo. >> docs\README.md
echo ## Giới thiệu >> docs\README.md
echo Hệ thống biểu quyết điện tử cho Tổng Công ty Điện lực Miền Trung (EVNCHP), phiên bản 6.0. >> docs\README.md
echo. >> docs\README.md
echo ## Cấu trúc dự án >> docs\README.md
echo - `/controllers` - Xử lý logic nghiệp vụ >> docs\README.md
echo - `/models` - Tương tác với database >> docs\README.md
echo - `/routes` - Định tuyến API >> docs\README.md
echo - `/middleware` - Middleware xác thực và validation >> docs\README.md
echo - `/services` - Business logic services >> docs\README.md
echo - `/public` - Frontend (HTML, CSS, JavaScript) >> docs\README.md
echo - `/database` - SQL scripts >> docs\README.md
echo - `/uploads` - File tải lên >> docs\README.md
echo - `/docs` - Tài liệu hệ thống >> docs\README.md
echo. >> docs\README.md
echo ## Cài đặt và chạy >> docs\README.md
echo. >> docs\README.md
echo ### Yêu cầu hệ thống >> docs\README.md
echo - Node.js ^>= 14.x >> docs\README.md
echo - SQL Server 2019+ >> docs\README.md
echo - Windows Server 2016+ hoặc Windows 10+ >> docs\README.md
echo. >> docs\README.md
echo ### Cài đặt >> docs\README.md
echo 1. Clone repository >> docs\README.md
echo 2. Cài đặt dependencies: `npm install` >> docs\README.md
echo 3. Cấu hình database trong file `.env` >> docs\README.md
echo 4. Chạy script tạo database: `database/create_database.sql` >> docs\README.md
echo 5. Khởi động server: `npm start` hoặc `start.bat` >> docs\README.md
echo. >> docs\README.md
echo ### Tài khoản mặc định >> docs\README.md
echo - Admin: `admin / admin123` >> docs\README.md
echo - User: `user1 / user123` >> docs\README.md
echo. >> docs\README.md
echo ## Tính năng chính >> docs\README.md
echo - Quản lý dự thảo tờ trình >> docs\README.md
echo - Tạo và quản lý phiếu biểu quyết >> docs\README.md
echo - Tham gia biểu quyết trực tuyến >> docs\README.md
echo - Xem kết quả và thống kê >> docs\README.md
echo - Quản lý nghị quyết >> docs\README.md
echo - Ký số văn bản >> docs\README.md
echo - Quản lý người dùng và phân quyền >> docs\README.md
echo - Thùng rác (soft delete) >> docs\README.md

:: Tạo file ARCHITECTURE.md mô tả kiến trúc hệ thống
echo # Kiến trúc Hệ thống HTBIEUQUYET V6 > docs\ARCHITECTURE.md
echo. >> docs\ARCHITECTURE.md
echo ## Tổng quan >> docs\ARCHITECTURE.md
echo Hệ thống được xây dựng theo mô hình MVC với: >> docs\ARCHITECTURE.md
echo - **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS + Bootstrap 5) >> docs\ARCHITECTURE.md
echo - **Backend**: Node.js + Express.js >> docs\ARCHITECTURE.md
echo - **Database**: SQL Server >> docs\ARCHITECTURE.md
echo - **Authentication**: JWT >> docs\ARCHITECTURE.md
echo. >> docs\ARCHITECTURE.md
echo ## Các module chính >> docs\ARCHITECTURE.md
echo. >> docs\ARCHITECTURE.md
echo ### 1. Authentication >> docs\ARCHITECTURE.md
echo - JWT token based authentication >> docs\ARCHITECTURE.md
echo - Login/logout functionality >> docs\ARCHITECTURE.md
echo - Role-based access control >> docs\ARCHITECTURE.md
echo. >> docs\ARCHITECTURE.md
echo ### 2. Quản lý dự thảo >> docs\ARCHITECTURE.md
echo - CRUD operations for drafts >> docs\ARCHITECTURE.md
echo - Comments and feedback >> docs\ARCHITECTURE.md
echo - File attachments >> docs\ARCHITECTURE.md
echo. >> docs\ARCHITECTURE.md
echo ### 3. Biểu quyết >> docs\ARCHITECTURE.md
echo - Create and manage votes >> docs\ARCHITECTURE.md
echo - Vote participation >> docs\ARCHITECTURE.md
echo - Results visualization >> docs\ARCHITECTURE.md
echo. >> docs\ARCHITECTURE.md
echo ### 4. Quản trị hệ thống >> docs\ARCHITECTURE.md
echo - User management >> docs\ARCHITECTURE.md
echo - Permission matrix >> docs\ARCHITECTURE.md
echo - System logs >> docs\ARCHITECTURE.md
echo. >> docs\ARCHITECTURE.md
echo ### 5. Thùng rác >> docs\ARCHITECTURE.md
echo - Soft delete functionality >> docs\ARCHITECTURE.md
echo - Restore capabilities >> docs\ARCHITECTURE.md
echo - Permanent deletion >> docs\ARCHITECTURE.md

echo.
echo ══════════════════════════════════════════
echo ✓ TỐI ƯU HOÀN TẤT!
echo.
echo Thông tin:
echo - Đã tạo backup trong thư mục: %backupFolder%
echo - Đã xóa %deletedCount% file không cần thiết
echo - Đã tạo cấu trúc thư mục chuẩn MVC
echo - Đã tạo file .gitignore và documentation
echo.
echo Các bước tiếp theo:
echo 1. Kiểm tra thư mục %backupFolder% để xem các file đã xóa
echo 2. Chạy 'npm install' để cập nhật dependencies
echo 3. Khởi động hệ thống bằng 'start.bat' hoặc 'npm start'
echo.
pause