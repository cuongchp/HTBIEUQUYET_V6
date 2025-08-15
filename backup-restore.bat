@echo off
title Backup & Restore Database
color 0B

echo ================================================================
echo           BACKUP & RESTORE DATABASE - HTBIEUQUYET
echo ================================================================
echo.

:MAIN_MENU
echo Chon thao tac:
echo [1] Backup Database
echo [2] Restore Database
echo [3] Danh sach backup
echo [4] Xoa backup
echo [0] Quay lai
echo.
set /p choice="Lua chon: "

if "%choice%"=="1" goto BACKUP
if "%choice%"=="2" goto RESTORE
if "%choice%"=="3" goto LIST_BACKUP
if "%choice%"=="4" goto DELETE_BACKUP
if "%choice%"=="0" exit
goto MAIN_MENU

:BACKUP
cls
echo 💾 BACKUP DATABASE
echo ================================================================
echo.

REM Tao thu muc backup neu chua co
if not exist "backup" mkdir backup

REM Tao ten file backup voi timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "datestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

set backup_file=backup\HTBIEUQUYET_backup_%datestamp%.bak

echo Dang backup database...
echo File backup: %backup_file%
echo.

REM Doc thong tin database tu .env (neu co)
if exist ".env" (
    for /f "tokens=2 delims==" %%i in ('findstr "DB_SERVER" .env') do set DB_SERVER=%%i
    for /f "tokens=2 delims==" %%i in ('findstr "DB_NAME" .env') do set DB_NAME=%%i
    for /f "tokens=2 delims==" %%i in ('findstr "DB_USER" .env') do set DB_USER=%%i
    for /f "tokens=2 delims==" %%i in ('findstr "DB_PASSWORD" .env') do set DB_PASSWORD=%%i
) else (
    echo ⚠️  File .env khong ton tai!
    set /p DB_SERVER="Nhap server name (mac dinh: localhost): "
    if "%DB_SERVER%"=="" set DB_SERVER=localhost
    set /p DB_NAME="Nhap database name: "
    set /p DB_USER="Nhap username: "
    set /p DB_PASSWORD="Nhap password: "
)

echo Server: %DB_SERVER%
echo Database: %DB_NAME%
echo.

REM Thuc hien backup
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "BACKUP DATABASE [%DB_NAME%] TO DISK = '%CD%\%backup_file%' WITH FORMAT, COMPRESSION"

if %errorlevel% equ 0 (
    echo ✅ Backup thanh cong!
    echo File: %backup_file%
    
    REM Hien thi kich thuoc file
    for %%I in ("%backup_file%") do echo Kich thuoc: %%~zI bytes
) else (
    echo ❌ Backup that bai!
)

pause
goto MAIN_MENU

:RESTORE
cls
echo 🔄 RESTORE DATABASE
echo ================================================================
echo.

if not exist "backup" (
    echo ❌ Thu muc backup khong ton tai!
    pause
    goto MAIN_MENU
)

echo Danh sach backup co san:
echo.
dir backup\*.bak /b 2>nul
if %errorlevel% neq 0 (
    echo ❌ Khong co file backup nao!
    pause
    goto MAIN_MENU
)

echo.
set /p backup_file="Nhap ten file backup: "

if not exist "backup\%backup_file%" (
    echo ❌ File backup khong ton tai!
    pause
    goto MAIN_MENU
)

echo.
echo ⚠️  CANH BAO: Thao tac nay se ghi de database hien tai!
set /p confirm="Ban co chac chan muon restore? (y/N): "
if /i not "%confirm%"=="y" (
    echo ❌ Da huy thao tac
    pause
    goto MAIN_MENU
)

REM Doc thong tin database
if exist ".env" (
    for /f "tokens=2 delims==" %%i in ('findstr "DB_SERVER" .env') do set DB_SERVER=%%i
    for /f "tokens=2 delims==" %%i in ('findstr "DB_NAME" .env') do set DB_NAME=%%i
    for /f "tokens=2 delims==" %%i in ('findstr "DB_USER" .env') do set DB_USER=%%i
    for /f "tokens=2 delims==" %%i in ('findstr "DB_PASSWORD" .env') do set DB_PASSWORD=%%i
) else (
    echo ⚠️  File .env khong ton tai!
    set /p DB_SERVER="Nhap server name (mac dinh: localhost): "
    if "%DB_SERVER%"=="" set DB_SERVER=localhost
    set /p DB_NAME="Nhap database name: "
    set /p DB_USER="Nhap username: "
    set /p DB_PASSWORD="Nhap password: "
)

echo.
echo Dang restore database...

REM Thuc hien restore
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "RESTORE DATABASE [%DB_NAME%] FROM DISK = '%CD%\backup\%backup_file%' WITH REPLACE"

if %errorlevel% equ 0 (
    echo ✅ Restore thanh cong!
) else (
    echo ❌ Restore that bai!
)

pause
goto MAIN_MENU

:LIST_BACKUP
cls
echo 📋 DANH SACH BACKUP
echo ================================================================
echo.

if not exist "backup" (
    echo ❌ Thu muc backup khong ton tai!
    pause
    goto MAIN_MENU
)

echo Danh sach backup:
echo.
dir backup\*.bak /s /-c
echo.

pause
goto MAIN_MENU

:DELETE_BACKUP
cls
echo 🗑️  XOA BACKUP
echo ================================================================
echo.

if not exist "backup" (
    echo ❌ Thu muc backup khong ton tai!
    pause
    goto MAIN_MENU
)

echo Danh sach backup:
echo.
dir backup\*.bak /b 2>nul
if %errorlevel% neq 0 (
    echo ❌ Khong co file backup nao!
    pause
    goto MAIN_MENU
)

echo.
echo Chon thao tac:
echo [1] Xoa 1 file cu the
echo [2] Xoa tat ca backup cu hon 30 ngay
echo [0] Quay lai
set /p del_choice="Lua chon: "

if "%del_choice%"=="1" (
    set /p backup_file="Nhap ten file backup can xoa: "
    if exist "backup\%%backup_file%%" (
        del "backup\%%backup_file%%"
        echo ✅ Da xoa file backup!
    ) else (
        echo ❌ File khong ton tai!
    )
) else if "%del_choice%"=="2" (
    echo Dang xoa backup cu hon 30 ngay...
    forfiles /p backup /s /m *.bak /d -30 /c "cmd /c del @path" 2>nul
    echo ✅ Da xoa backup cu!
) else if "%del_choice%"=="0" (
    goto MAIN_MENU
)

pause
goto MAIN_MENU
