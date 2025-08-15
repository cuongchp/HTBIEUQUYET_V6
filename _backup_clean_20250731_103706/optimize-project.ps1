# Script tối ưu dự án HTBIEUQUYET_V6
Write-Host "===== BAT DAU TOI UU DU AN =====" -ForegroundColor Green

# 1. Tao backup voi timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "_backup_$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# 2. Xac dinh file can xoa
$deletePatterns = @(
    "test_*.js",
    "test_*.html",
    "test.html",
    "check_*.js",
    "debug_*.js",
    "add-test-files.js",
    "blue_theme_ready.bat",
    "check-system.bat",
    "debug.bat",
    "deploy-production.bat",
    "fix-*.bat",
    "install-requirements.bat",
    "reset-database.bat",
    "setup-*.bat",
    "start-dev.bat",
    "update-project.bat",
    "verify-*.bat",
    "analyze-*.bat",
    "DEBUG_*.md",
    "TROUBLESHOOTING_*.md",
    "INSTALL_*.md",
    "ERROR_*.md",
    "UPDATE_*.md",
    "DEPLOYMENT_*.md",
    "NOI DUNG PHAN MEM",
    "*.log",
    "npm-debug.log*",
    "yarn-*.log*",
    "*.tmp",
    "*.temp",
    "*.bak"
)

# 3. Backup va xoa file khong can thiet
Write-Host "`nXoa file khong can thiet..." -ForegroundColor Yellow
$deletedCount = 0
foreach ($pattern in $deletePatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -File -Recurse -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if ($file.DirectoryName -notlike "*node_modules*") {
            Copy-Item $file.FullName -Destination "$backupDir\$($file.Name)" -Force
            Remove-Item $file.FullName -Force
            Write-Host "  - Xoa: $($file.Name)" -ForegroundColor Red
            $deletedCount++
        }
    }
}

# 4. Xu ly file duplicate trong routes
Write-Host "`nXu ly file duplicate..." -ForegroundColor Yellow
if ((Test-Path "routes\drafts_fixed.js") -and (Test-Path "routes\drafts.js")) {
    Copy-Item "routes\drafts.js" -Destination "$backupDir\drafts_original.js" -Force
    Copy-Item "routes\drafts_fixed.js" -Destination "routes\drafts.js" -Force
    Remove-Item "routes\drafts_fixed.js" -Force
    Write-Host "  - Su dung drafts_fixed.js lam file chinh" -ForegroundColor Green
}

# Xoa backup files
$backupFiles = @("routes\drafts_backup.js", "public\js\modules\drafts_backup.js")
foreach ($file in $backupFiles) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Copy-Item $file -Destination "$backupDir\$fileName" -Force
        Remove-Item $file -Force
        Write-Host "  - Xoa backup: $file" -ForegroundColor Red
    }
}

# 5. Tao cau truc thu muc chuan
Write-Host "`nTao cau truc thu muc chuan..." -ForegroundColor Yellow
$folders = @(
    "public\css",
    "public\js\modules",
    "public\images",
    "routes",
    "database",
    "uploads\votes",
    "uploads\drafts",
    "uploads\documents",
    "logs",
    "docs"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "  + $folder" -ForegroundColor Green
}

# 6. Di chuyen documentation quan trong
Write-Host "`nTo chuc documentation..." -ForegroundColor Yellow
$docFiles = @("README.md", "PROJECT_SUMMARY.md", "PROJECT_DESCRIPTION.md")
foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        Move-Item $doc -Destination "docs\$doc" -Force
        Write-Host "  - Di chuyen $doc -> docs\" -ForegroundColor Green
    }
}

# 7. Tao file cau hinh chuan
Write-Host "`nTao file cau hinh..." -ForegroundColor Yellow

# Tao .gitignore
$gitignoreContent = "node_modules/`n.env`n.env.local`n*.log`nlogs/`nuploads/*`n!uploads/.gitkeep`n_backup_*/`n.vscode/`n.idea/`n*.swp`n.DS_Store`nThumbs.db"
Set-Content -Path ".gitignore" -Value $gitignoreContent -Encoding UTF8

# Tao start.bat don gian
$startBatContent = "@echo off`ntitle HE THONG BIEU QUYET EVNCHP`necho ===== KHOI DONG HE THONG =====`necho.`nnpm start`npause"
Set-Content -Path "start.bat" -Value $startBatContent -Encoding UTF8

# 8. Tao .env.example
$envContent = "# Database Configuration`nDB_SERVER=localhost`nDB_NAME=HTBIEUQUYET`nDB_USER=sa`nDB_PASSWORD=your_password`n`n# Server Configuration`nPORT=3000`nNODE_ENV=production`n`n# Session Secret`nSESSION_SECRET=your_session_secret_here"
Set-Content -Path ".env.example" -Value $envContent -Encoding UTF8

# 9. Thong ke ket qua
Write-Host "`n===== KET QUA TOI UU =====" -ForegroundColor Green
$remainingFiles = 0
Get-ChildItem -File -Recurse | ForEach-Object {
    if ($_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*$backupDir*") {
        $remainingFiles++
    }
}

Write-Host "Da xoa: $deletedCount file khong can thiet" -ForegroundColor Red
Write-Host "Con lai: $remainingFiles file trong du an" -ForegroundColor Cyan
Write-Host "Backup: $backupDir" -ForegroundColor Yellow
Write-Host "`nDu an da duoc toi uu thanh cong!" -ForegroundColor Green