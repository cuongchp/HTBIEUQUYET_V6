@echo off
echo ===== DON DEP DU AN - ALL IN ONE =====
echo.

REM Tao file PowerShell tam thoi
echo # Script xoa file khong can thiet > temp_clean.ps1
echo Write-Host "===== XOA TAT CA FILE KHONG CAN THIET =====" -ForegroundColor Green >> temp_clean.ps1
echo. >> temp_clean.ps1
echo # Tao backup >> temp_clean.ps1
echo $timestamp = Get-Date -Format "yyyyMMdd_HHmmss" >> temp_clean.ps1
echo $backupDir = "_backup_clean_$timestamp" >> temp_clean.ps1
echo New-Item -ItemType Directory -Path $backupDir -Force -ErrorAction SilentlyContinue ^| Out-Null >> temp_clean.ps1
echo Write-Host "Backup folder: $backupDir" -ForegroundColor Yellow >> temp_clean.ps1
echo. >> temp_clean.ps1
echo # Danh sach file can xoa >> temp_clean.ps1
echo $filesToDelete = @( >> temp_clean.ps1
echo     "test_*.js", "check_*.js", "debug_*.js", "*.bat", >> temp_clean.ps1
echo     "*.md", "NOI DUNG PHAN MEM", "*.log", >> temp_clean.ps1
echo     "routes\*_backup.js", "routes\*_fixed.js" >> temp_clean.ps1
echo ) >> temp_clean.ps1
echo. >> temp_clean.ps1
echo # Xoa file >> temp_clean.ps1
echo $deletedCount = 0 >> temp_clean.ps1
echo foreach ($pattern in $filesToDelete) { >> temp_clean.ps1
echo     Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue ^| >> temp_clean.ps1
echo     Where-Object { $_.DirectoryName -notlike "*node_modules*" } ^| >> temp_clean.ps1
echo     ForEach-Object { >> temp_clean.ps1
echo         try { >> temp_clean.ps1
echo             Copy-Item $_.FullName -Destination "$backupDir\$($_.Name)" -Force >> temp_clean.ps1
echo             Remove-Item $_.FullName -Force >> temp_clean.ps1
echo             Write-Host "  - Xoa: $($_.Name)" -ForegroundColor Red >> temp_clean.ps1
echo             $deletedCount++ >> temp_clean.ps1
echo         } catch {} >> temp_clean.ps1
echo     } >> temp_clean.ps1
echo } >> temp_clean.ps1
echo. >> temp_clean.ps1
echo Write-Host "`nDa xoa: $deletedCount file" -ForegroundColor Green >> temp_clean.ps1
echo Write-Host "Backup tai: $backupDir" -ForegroundColor Yellow >> temp_clean.ps1

REM Chay PowerShell script
powershell -ExecutionPolicy Bypass -File temp_clean.ps1

REM Xoa file tam
del temp_clean.ps1

echo.
echo Hoan thanh!
pause