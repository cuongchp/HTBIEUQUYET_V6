# Script dọn dẹp và tối ưu dự án HTBIEUQUYET_V6
# Chạy script: .\cleanup-project.ps1

Write-Host "===== BẮT ĐẦU DỌN DẸP DỰ ÁN HTBIEUQUYET_V6 =====" -ForegroundColor Green

# Tạo thư mục backup với timestamp
$backupFolder = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Tạo thư mục backup: $backupFolder" -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

# Danh sách file test và debug cần xóa
$filesToDelete = @(
    # Test files
    "test_*.js",
    "check_*.js", 
    "debug_*.js",
    "add-test-files.js",
    "test_simple.html",
    "test.html",
    
    # Batch files không cần thiết
    "blue_theme_ready.bat",
    "check-system.bat",
    "debug.bat",
    "deploy-production.bat",
    "fix-all-issues.bat",
    "fix-database-errors.bat",
    "fix-delete-*.bat",
    "fix-voting-*.bat",
    "install-requirements.bat",
    "optimize-project.bat",
    "reset-database.bat",
    "setup-*.bat",
    "start-dev.bat",
    "update-project.bat",
    "verify-*.bat",
    
    # File tạm và log
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    
    # Documentation files cũ
    "DEBUG_*.md",
    "TROUBLESHOOTING_*.md",
    "INSTALL_*.md",
    "NOI DUNG PHAN MEM"
)

# Backup và xóa các file không cần thiết
Write-Host "`nBackup và xóa các file không cần thiết..." -ForegroundColor Yellow
foreach ($pattern in $filesToDelete) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        # Backup file
        Copy-Item $file.FullName -Destination "$backupFolder\$($file.Name)" -Force
        # Xóa file
        Remove-Item $file.FullName -Force
        Write-Host "  - Đã xóa: $($file.Name)" -ForegroundColor Red
    }
}

# Tạo thư mục docs nếu chưa có
Write-Host "`nTạo thư mục docs cho documentation..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "docs" -Force | Out-Null

# Di chuyển các file documentation quan trọng vào thư mục docs
$docsToMove = @(
    "README.md",
    "PROJECT_SUMMARY.md",
    "PROJECT_DESCRIPTION.md"
)

foreach ($doc in $docsToMove) {
    if (Test-Path $doc) {
        Move-Item $doc -Destination "docs\$doc" -Force
        Write-Host "  - Di chuyển $doc vào thư mục docs" -ForegroundColor Green
    }
}

# Backup các file route có nhiều version
Write-Host "`nBackup các file route có nhiều version..." -ForegroundColor Yellow
$routeBackups = @(
    "routes\drafts_backup.js",
    "routes\drafts_fixed.js",
    "public\js\modules\drafts_backup.js",
    "public\js\modules\drafts_fixed.js"
)

foreach ($route in $routeBackups) {
    if (Test-Path $route) {
        $fileName = Split-Path $route -Leaf
        Copy-Item $route -Destination "$backupFolder\$fileName" -Force
        Remove-Item $route -Force
        Write-Host "  - Backup và xóa: $fileName" -ForegroundColor Red
    }
}

# Tạo file .gitignore nếu chưa có
Write-Host "`nTạo file .gitignore..." -ForegroundColor Yellow
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

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Backup folders
backup_*/

# Logs
logs/
*.log

# Test files
test_*.js
check_*.js
debug_*.js
"@

Set-Content -Path ".gitignore" -Value $gitignoreContent -Encoding UTF8

# Tạo file start.bat đơn giản
Write-Host "`nTạo file start.bat mới..." -ForegroundColor Yellow
$startBatContent = @"
@echo off
echo ===== KHOI DONG HE THONG BIEU QUYET =====
echo.
echo Dang khoi dong server...
npm start
pause
"@

Set-Content -Path "start.bat" -Value $startBatContent -Encoding UTF8

# Kiểm tra và đảm bảo cấu trúc thư mục chuẩn
Write-Host "`nKiểm tra cấu trúc thư mục..." -ForegroundColor Yellow
$requiredFolders = @(
    "public\css",
    "public\js",
    "public\js\modules",
    "routes",
    "database",
    "uploads\votes",
    "uploads\drafts",
    "uploads\documents",
    "docs"
)

foreach ($folder in $requiredFolders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "  ✓ $folder" -ForegroundColor Green
}

# Tạo file README.md mới trong thư mục docs
Write-Host "`nTạo file README.md mới..." -ForegroundColor Yellow
$readmeContent = @"
# HỆ THỐNG BIỂU QUYẾT EVNCHP V6

## Giới thiệu
Hệ thống biểu quyết điện tử cho EVNCHP, hỗ trợ quản lý và thực hiện các cuộc biểu quyết trực tuyến.

## Cấu trúc dự án
- `/public` - Frontend files (HTML, CSS, JS)
- `/routes` - API routes
- `/database` - Database scripts
- `/uploads` - File uploads
- `/docs` - Documentation

## Cài đặt
1. Clone repository
2. Cài đặt dependencies: ``npm install``
3. Cấu hình database trong file ``.env``
4. Chạy database script: ``database/create_database.sql``
5. Khởi động server: ``npm start`` hoặc ``start.bat``

## Yêu cầu hệ thống
- Node.js >= 14.x
- SQL Server 2019+
- Windows Server 2016+
"@

Set-Content -Path "docs\README.md" -Value $readmeContent -Encoding UTF8

# Thống kê kết quả
Write-Host "`n===== KẾT QUẢ DỌN DẸP =====" -ForegroundColor Green
$remainingFiles = (Get-ChildItem -File -Recurse | Where-Object { $_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*$backupFolder*" }).Count
Write-Host "Số file còn lại trong dự án: $remainingFiles" -ForegroundColor Cyan
Write-Host "Backup được lưu tại: $backupFolder" -ForegroundColor Yellow
Write-Host "`nDự án đã được tối ưu!" -ForegroundColor Green
Write-Host "Chạy 'start.bat' để khởi động hệ thống." -ForegroundColor Yellow