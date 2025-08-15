# Script tối ưu dự án HTBIEUQUYET_V6
# Sử dụng cú pháp PowerShell thuần túy

Write-Host "===== BẮT ĐẦU TỐI ƯU DỰ ÁN HTBIEUQUYET_V6 =====" -ForegroundColor Green

# Tạo thư mục backup với timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFolder = "backup_$timestamp"
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
Write-Host "Đã tạo thư mục backup: $backupFolder" -ForegroundColor Cyan

# Danh sách file không cần thiết cần xóa
$filesToDelete = @(
    # Test files
    "test*.js",
    "test*.bat",
    "test*.html",
    "*_test.js",
    "*_test.bat",
    "debug*.js",
    "debug*.bat",
    "debug*.html",
    "verify*.js",
    "setup*.bat",
    "launch*.bat",
    
    # Batch files không cần thiết
    "check_*.bat",
    "monitor.bat",
    "menu.bat",
    "fix-*.bat",
    "fix_*.bat",
    "restart*.bat",
    "performance*.bat",
    "move_*.bat",
    "backup*.bat"
)

# Danh sách file markdown không cần thiết
$mdFilesToDelete = @(
    "ADMIN_*.md",
    "CONSOLIDATION_*.md",
    "DRAFT_*.md",
    "FRONTEND_*.md",
    "PERFORMANCE_*.md",
    "README_*.md",
    "SCRIPTS_*.md",
    "SECURITY_*.md",
    "SERVER_*.md",
    "SOFT_DELETE_*.md"
)

# Xóa các file không cần thiết
Write-Host "`nXóa các file không cần thiết..." -ForegroundColor Yellow
$deletedCount = 0

# Xử lý các file thông thường
foreach ($pattern in $filesToDelete) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -Recurse -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        # Kiểm tra nếu file nằm trong node_modules
        if ($file.FullName -notlike "*\node_modules\*" -and $file.Name -ne "RUN_OPTIMIZE.bat") {
            try {
                # Tạo cấu trúc thư mục tương tự trong backup
                $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
                $backupPath = Join-Path -Path $backupFolder -ChildPath $relativePath
                $backupDir = Split-Path -Path $backupPath -Parent
                
                # Tạo thư mục backup nếu chưa có
                if (!(Test-Path -Path $backupDir)) {
                    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
                }
                
                # Backup file
                Copy-Item -Path $file.FullName -Destination $backupPath -Force
                
                # Xóa file
                Remove-Item -Path $file.FullName -Force
                $deletedCount++
                Write-Host "  - Đã xóa: $relativePath" -ForegroundColor Red
            }
            catch {
                Write-Host "  ! Lỗi xử lý file: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
}

# Xử lý các file markdown
foreach ($pattern in $mdFilesToDelete) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        try {
            # Backup file
            Copy-Item -Path $file.FullName -Destination "$backupFolder\$($file.Name)" -Force
            
            # Xóa file
            Remove-Item -Path $file.FullName -Force
            $deletedCount++
            Write-Host "  - Đã xóa: $($file.Name)" -ForegroundColor Red
        }
        catch {
            Write-Host "  ! Lỗi xử lý file: $($file.FullName) - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Tạo thư mục docs và di chuyển tài liệu quan trọng
Write-Host "`nTổ chức lại tài liệu..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "docs" -Force | Out-Null

# Tạo file README.md mới trong docs
$readmeContent = @"
# HỆ THỐNG BIỂU QUYẾT ĐIỆN TỬ EVNCHP V6

## Giới thiệu
Hệ thống biểu quyết điện tử cho Tổng Công ty Điện lực Miền Trung (EVNCHP), phiên bản 6.0.

## Cấu trúc dự án
- `/public` - Frontend (HTML, CSS, JavaScript)
- `/routes` - API routes (Express.js)
- `/services` - Business logic services
- `/middleware` - Express middleware
- `/database` - SQL scripts
- `/uploads` - File uploads directory
- `/docs` - Documentation

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 14.x
- SQL Server 2019+
- Windows Server 2016+ hoặc Windows 10+

### Cài đặt
1. Clone repository
2. Cài đặt dependencies: `npm install`
3. Cấu hình database trong file `.env`
4. Chạy script tạo database: `database/create_database.sql`
5. Khởi động server: `npm start` hoặc `start.bat`

### Tài khoản mặc định
- Admin: `admin / admin123`
- User: `user1 / user123`

## Tính năng chính
- Quản lý dự thảo tờ trình
- Tạo và quản lý phiếu biểu quyết
- Tham gia biểu quyết trực tuyến
- Xem kết quả và thống kê
- Quản lý nghị quyết
- Ký số văn bản
- Quản lý người dùng và phân quyền
- Thùng rác (soft delete)

## API Documentation
Server chạy trên port 3000 (có thể cấu hình trong .env)
- Base URL: `http://localhost:3000`
- API prefix: `/api`

## Bảo mật
- JWT authentication
- SQL injection prevention
- XSS protection
- File upload validation
- Role-based access control

## Liên hệ
- Hotline: 1900 1909
- Email: support@evncpc.vn
- Website: https://cpc.vn
"@

Set-Content -Path "docs\README.md" -Value $readmeContent -Encoding UTF8
Write-Host "  ✓ Đã tạo docs\README.md" -ForegroundColor Green

# Tạo file start.bat mới (đơn giản hóa)
$startBatContent = @"
@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║   HỆ THỐNG BIỂU QUYẾT ĐIỆN TỬ EVNCHP    ║
echo ║              Phiên bản 6.0               ║
echo ╚══════════════════════════════════════════╝
echo.
echo Đang khởi động server...
echo.
npm start
pause
"@

Set-Content -Path "start.bat" -Value $startBatContent -Encoding UTF8
Write-Host "  ✓ Đã cập nhật start.bat" -ForegroundColor Green

# Xóa các thư mục rỗng
Write-Host "`nDọn dẹp thư mục rỗng..." -ForegroundColor Yellow
$emptyDirs = Get-ChildItem -Directory -Recurse | Where-Object { 
    (Get-ChildItem $_.FullName -Force | Measure-Object).Count -eq 0 -and 
    $_.Name -ne "uploads" -and 
    $_.Name -ne "logs" -and
    $_.Parent.Name -ne "uploads"
}

foreach ($dir in $emptyDirs) {
    try {
        Remove-Item $dir.FullName -Force -Recurse -ErrorAction SilentlyContinue
        Write-Host "  - Đã xóa thư mục rỗng: $($dir.FullName)" -ForegroundColor Red
    }
    catch {
        Write-Host "  ! Lỗi khi xóa thư mục: $($dir.FullName) - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Tối ưu file package.json nếu có
Write-Host "`nKiểm tra package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    try {
        $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        
        # Cập nhật scripts
        $packageJson.scripts = @{
            "start" = "node server.js"
            "dev" = "nodemon server.js"
            "test" = "echo 'No tests configured'"
        }
        
        # Cập nhật thông tin
        $packageJson.name = "htbieuquyet-v6"
        $packageJson.version = "6.0.0"
        $packageJson.description = "Hệ thống biểu quyết điện tử EVNCHP"
        $packageJson.main = "server.js"
        $packageJson.author = "EVNCHP IT Team"
        $packageJson.license = "MIT"
        
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json" -Encoding UTF8
        Write-Host "  ✓ Đã tối ưu package.json" -ForegroundColor Green
    }
    catch {
        Write-Host "  ! Lỗi khi xử lý package.json: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Cập nhật file .gitignore
Write-Host "`nCập nhật file .gitignore..." -ForegroundColor Yellow
$gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Upload files
uploads/
!uploads/.gitkeep

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
desktop.ini

# Backup folders
backup_*/

# Logs
logs/
*.log

# Test files
test_*.js
check_*.js
debug_*.js
*_test.js
*_debug.js

# Temporary files
temp/
tmp/
*.tmp
*.temp

# Build output
dist/
build/

# Database files
*.mdf
*.ldf
*.bak
"@

Set-Content -Path ".gitignore" -Value $gitignoreContent -Encoding UTF8
Write-Host "  ✓ Đã cập nhật .gitignore" -ForegroundColor Green

# Thống kê kết quả
Write-Host "`n===== KẾT QUẢ TỐI ƯU =====" -ForegroundColor Green
Write-Host "Đã xóa $deletedCount file không cần thiết" -ForegroundColor Cyan
Write-Host "Backup được lưu tại: $backupFolder" -ForegroundColor Yellow

# Đếm số file còn lại
$remainingFiles = (Get-ChildItem -File -Recurse | Where-Object { 
    $_.DirectoryName -notlike "*node_modules*" -and 
    $_.DirectoryName -notlike "*$backupFolder*" -and
    $_.DirectoryName -notlike "*\.git*"
}).Count

Write-Host "Số file còn lại trong dự án: $remainingFiles" -ForegroundColor Cyan
Write-Host "`nDự án đã được tối ưu thành công!" -ForegroundColor Green
Write-Host "Chạy 'start.bat' để khởi động hệ thống." -ForegroundColor Yellow
