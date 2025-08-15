# Script xoa tat ca file khong can thiet - FIXED VERSION
Write-Host "===== XOA TAT CA FILE KHONG CAN THIET =====" -ForegroundColor Green

# Tao backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "_backup_clean_$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force -ErrorAction SilentlyContinue | Out-Null
Write-Host "Backup folder: $backupDir" -ForegroundColor Yellow

# Danh sach file cu the can xoa
$filesToDelete = @(
    # Test files
    "test_database.js",
    "test_sql_simple.js", 
    "test_delete_logic.js",
    "check_db_structure.js",
    "check_drafts_table.js",
    "check_vote_results.js",
    "debug_vote_process.js",
    "debug_drafts.js",
    "debug_user_permissions.js",
    "test_simple.html",
    "test.html",
    "add-test-files.js",
    
    # Batch files
    "analyze-project.bat",
    "blue_theme_ready.bat",
    "check-system.bat",
    "debug.bat",
    "deploy-production.bat",
    "fix-all-issues.bat",
    "fix-database-errors.bat",
    "fix-delete-drafts.bat",
    "fix-delete-functionality.bat",
    "fix-voting-results.bat",
    "install-requirements.bat",
    "optimize-project.bat",
    "reset-database.bat",
    "setup-admin.bat",
    "setup-database.bat",
    "setup-project.bat",
    "start-dev.bat",
    "start-project.bat",
    "update-project.bat",
    "verify-installation.bat",
    "verify-project.bat",
    
    # PowerShell scripts khong can
    "optimize-project.ps1",
    "cleanup-project.ps1",
    "safe-cleanup.bat",
    "restore-drafts.bat",
    "cleanup-project.bat",
    "RUN_OPTIMIZE.bat",
    
    # Documentation files
    "DEBUG_DELETE_FUNCTION.md",
    "DEBUG_STEPS.md",
    "DEPLOYMENT_GUIDE.md",
    "ERROR_FIXES.md",
    "INSTALL_GUIDE_SIMPLE.md",
    "PROJECT_DESCRIPTION.md",
    "TROUBLESHOOTING_GUIDE.md",
    "UPDATE_GUIDE.md",
    "NOI DUNG PHAN MEM",
    
    # Duplicate/backup files trong routes
    "routes\drafts_backup.js",
    "routes\drafts_fixed.js",
    
    # Module duplicates
    "public\js\modules\drafts_backup.js",
    "public\js\modules\drafts_fixed.js"
)

# Xoa tung file
$deletedCount = 0
Write-Host "`nDang xoa file..." -ForegroundColor Yellow
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        try {
            # Backup truoc khi xoa
            $fileName = Split-Path $file -Leaf
            $backupPath = Join-Path $backupDir $fileName
            
            # Neu file da ton tai trong backup, them so vao ten
            $counter = 1
            while (Test-Path $backupPath) {
                $backupPath = Join-Path $backupDir "${fileName}_$counter"
                $counter++
            }
            
            Copy-Item $file -Destination $backupPath -Force -ErrorAction Stop
            
            # Xoa file
            Remove-Item $file -Force -ErrorAction Stop
            Write-Host "  - Xoa: $file" -ForegroundColor Red
            $deletedCount++
        }
        catch {
            Write-Host "  ! Loi khi xu ly: $file - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Xoa file log va file ten la
Write-Host "`nXoa file log va file khong hop le..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match "\.log$|^console\.log|^npm-debug|^yarn-" -and
    $_.DirectoryName -notlike "*node_modules*" -and
    $_.DirectoryName -notlike "*$backupDir*"
} | ForEach-Object {
    try {
        $backupName = $_.Name -replace '[<>:"|?*]', '_'
        Copy-Item $_.FullName -Destination "$backupDir\$backupName" -Force -ErrorAction Stop
        Remove-Item $_.FullName -Force -ErrorAction Stop
        Write-Host "  - Xoa: $($_.Name)" -ForegroundColor Red
        $deletedCount++
    }
    catch {
        Write-Host "  ! Bo qua: $($_.Name) - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Tao file start.bat moi
try {
    $startContent = "@echo off`necho ===== HE THONG BIEU QUYET EVNCHP =====`necho.`nnpm start`npause"
    Set-Content -Path "start.bat" -Value $startContent -Force
    Write-Host "`nDa tao file start.bat moi" -ForegroundColor Green
}
catch {
    Write-Host "Khong the tao start.bat: $_" -ForegroundColor Yellow
}

# Di chuyen documentation
if (!(Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" -Force -ErrorAction SilentlyContinue | Out-Null
}

@("README.md", "PROJECT_SUMMARY.md") | ForEach-Object {
    if (Test-Path $_) {
        try {
            Move-Item $_ -Destination "docs\$_" -Force -ErrorAction Stop
            Write-Host "Di chuyen $_ -> docs\" -ForegroundColor Green
        }
        catch {
            Write-Host "Khong the di chuyen $_" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n===== HOAN THANH =====" -ForegroundColor Green
Write-Host "Da xoa: $deletedCount file" -ForegroundColor Red
Write-Host "Backup tai: $backupDir" -ForegroundColor Yellow
Write-Host "`nDu an da duoc don dep!" -ForegroundColor Green