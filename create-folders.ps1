# Script tạo cấu trúc thư mục chuẩn cho dự án HTBIEUQUYET_V6

# Danh sách thư mục cần tạo
$folders = @(
    "public\css",
    "public\js",
    "public\js\modules",
    "public\images",
    "public\fonts",
    "routes",
    "services",
    "middleware",
    "database",
    "uploads\votes",
    "uploads\drafts", 
    "uploads\documents",
    "uploads\temp",
    "logs",
    "docs",
    "utils"
)

Write-Host "Tạo cấu trúc thư mục chuẩn..." -ForegroundColor Yellow

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    
    # Tạo .gitkeep cho uploads folders
    if ($folder -like "uploads*") {
        New-Item -ItemType File -Path "$folder\.gitkeep" -Force | Out-Null
    }
    
    Write-Host "  ✓ $folder" -ForegroundColor Green
}

Write-Host "`nHoàn tất tạo cấu trúc thư mục!" -ForegroundColor Green
