:: filepath: d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6\fix-sql-server.bat
@echo off
echo ===============================================
echo    FIX SQL SERVER CONNECTION
echo ===============================================

echo Step 1: Starting SQL Server services...
net start "SQL Server (SQLEXPRESS)" 2>nul
net start "SQLBrowser" 2>nul

echo.
echo Step 2: Testing database connections...
node quick-fix-login.js

echo.
echo Step 3: If config was found, apply it...
if exist .env.fixed (
    echo ✅ Working config found! Applying...
    copy .env.fixed .env >nul
    echo ✅ Updated .env file
    
    echo.
    echo Step 4: Restarting application...
    echo Press Ctrl+C to stop if server starts successfully
    npm start
) else (
    echo ❌ No working config found
    echo.
    echo Manual steps required:
    echo 1. Open SQL Server Configuration Manager
    echo 2. Enable TCP/IP for SQLEXPRESS
    echo 3. Start SQL Server Browser
    echo 4. Check firewall settings
    pause
)