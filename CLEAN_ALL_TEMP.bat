@echo off
echo ===== XOA TAT CA FILE TAM VA KHONG CAN THIET =====
echo.

REM Tao backup
set BACKUP=_backup_%date:~-4%%date:~3,2%%date:~0,2%_%random%
mkdir "%BACKUP%" 2>nul
echo Backup folder: %BACKUP%
echo.

REM 1. XOA FILE TEST (tat ca dang test)
echo [1] Xoa file test...
move test*.js "%BACKUP%\" >nul 2>&1
move test*.html "%BACKUP%\" >nul 2>&1
move check*.js "%BACKUP%\" >nul 2>&1
move debug*.js "%BACKUP%\" >nul 2>&1
move add-test*.js "%BACKUP%\" >nul 2>&1

REM 2. XOA FILE BATCH (tru start.bat va file nay)
echo [2] Xoa file batch...
for %%f in (*.bat) do (
    if /I not "%%f"=="CLEAN_ALL_TEMP.bat" (
        if /I not "%%f"=="start.bat" (
            move "%%f" "%BACKUP%\" >nul 2>&1
        )
    )
)

REM 3. XOA POWERSHELL
echo [3] Xoa PowerShell scripts...
move *.ps1 "%BACKUP%\" >nul 2>&1

REM 4. XOA DOCUMENTATION  
echo [4] Xoa documentation cu...
if not exist "docs" mkdir "docs"
if exist "README.md" move "README.md" "docs\" >nul 2>&1
if exist "PROJECT_SUMMARY.md" move "PROJECT_SUMMARY.md" "docs\" >nul 2>&1

REM Xoa cac file MD khac
move DEBUG*.md "%BACKUP%\" >nul 2>&1
move TROUBLESHOOTING*.md "%BACKUP%\" >nul 2>&1
move ERROR*.md "%BACKUP%\" >nul 2>&1
move INSTALL*.md "%BACKUP%\" >nul 2>&1
move UPDATE*.md "%BACKUP%\" >nul 2>&1
move DEPLOYMENT*.md "%BACKUP%\" >nul 2>&1
move PROJECT_DESCRIPTION.md "%BACKUP%\" >nul 2>&1

REM 5. XOA FILE LOG VA TEMP
echo [5] Xoa log va temp files...
move *.log "%BACKUP%\" >nul 2>&1
move *.tmp "%BACKUP%\" >nul 2>&1
move *.temp "%BACKUP%\" >nul 2>&1
move *.bak "%BACKUP%\" >nul 2>&1
move npm-debug* "%BACKUP%\" >nul 2>&1
move yarn-*.log "%BACKUP%\" >nul 2>&1

REM 6. XOA FILE LAM
echo [6] Xoa file lam khac...
if exist "console.log*" del /F /Q "console.log*" >nul 2>&1
if exist "NOI DUNG PHAN MEM" move "NOI DUNG PHAN MEM" "%BACKUP%\" >nul 2>&1

REM 7. XOA TRONG ROUTES
echo [7] Xoa file duplicate trong routes...
if exist "routes\drafts_backup.js" move "routes\drafts_backup.js" "%BACKUP%\" >nul 2>&1
if exist "routes\drafts_fixed.js" (
    if exist "routes\drafts.js" (
        move "routes\drafts.js" "%BACKUP%\drafts_old.js" >nul 2>&1
    )
    move "routes\drafts_fixed.js" "routes\drafts.js" >nul 2>&1
)

REM 8. XOA TRONG PUBLIC/JS/MODULES
echo [8] Xoa file duplicate trong modules...
if exist "public\js\modules\drafts_backup.js" move "public\js\modules\drafts_backup.js" "%BACKUP%\" >nul 2>&1
if exist "public\js\modules\drafts_fixed.js" move "public\js\modules\drafts_fixed.js" "%BACKUP%\" >nul 2>&1

REM 9. XOA BACKUP FOLDERS CU
echo [9] Xoa backup folders cu...
for /d %%d in (_backup*) do (
    if /I not "%%d"=="%BACKUP%" (
        echo    - Xoa folder: %%d
        move "%%d" "%BACKUP%\old_%%d" >nul 2>&1
    )
)

REM 10. KIEM TRA VA XOA FILE KHAC
echo [10] Kiem tra file khac...
REM Xoa tat ca file bat con lai (tru 2 file can giu)
dir /b *.bat 2>nul | findstr /v /i "CLEAN_ALL_TEMP.bat start.bat" >temp_bat_list.txt
for /f "delims=" %%f in (temp_bat_list.txt) do (
    move "%%f" "%BACKUP%\" >nul 2>&1
)
del temp_bat_list.txt >nul 2>&1

REM Liet ke file da xoa
echo.
echo ===== DA XOA =====
dir /b "%BACKUP%" 2>nul | find /c /v "" >temp_count.txt
set /p FILE_COUNT=<temp_count.txt
del temp_count.txt >nul 2>&1
echo Tong so file da xoa: %FILE_COUNT%

REM Liet ke file con lai trong root
echo.
echo ===== FILE CON LAI (khong tinh node_modules) =====
dir /b /a-d 2>nul | find /v /i "node_modules"

echo.
echo Backup tai: %BACKUP%
echo.
pause