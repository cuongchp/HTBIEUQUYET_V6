@echo off
echo ===== DON DEP DU AN DON GIAN =====
echo.

REM Tao backup
set BACKUP=_backup_%random%
mkdir %BACKUP% 2>nul

REM Xoa file khong can
echo Dang xoa file...
move test_*.js %BACKUP%\ >nul 2>&1
move check_*.js %BACKUP%\ >nul 2>&1
move debug_*.js %BACKUP%\ >nul 2>&1
move *.ps1 %BACKUP%\ >nul 2>&1
move DEBUG_*.md %BACKUP%\ >nul 2>&1
move TROUBLESHOOTING_*.md %BACKUP%\ >nul 2>&1
move *.log %BACKUP%\ >nul 2>&1

REM Xoa bat files (tru file nay va start.bat)
for %%f in (*.bat) do (
    if /I not "%%f"=="CLEAN_SIMPLE.bat" (
        if /I not "%%f"=="start.bat" (
            move %%f %BACKUP%\ >nul 2>&1
        )
    )
)

echo.
echo Hoan thanh! Backup tai: %BACKUP%
pause