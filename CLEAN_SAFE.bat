@echo off
echo ===== DON DEP DU AN AN TOAN =====
echo.

REM Kiem tra quyen admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Dang chay voi quyen Administrator
) else (
    echo [!] Can chay voi quyen Administrator
    echo Right-click file nay va chon "Run as administrator"
    pause
    exit /b
)

echo.
echo Dang thuc hien...
powershell -ExecutionPolicy Bypass -File "clean-all-unnecessary.ps1"

echo.
echo Hoan thanh!
pause