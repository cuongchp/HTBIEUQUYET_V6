@echo off
title Test Admin Drafts API Fix
echo ============================================
echo   TESTING ADMIN DRAFTS API FIX
echo ============================================
echo.
echo ❌ Previous errors:
echo    - 500 Internal Server Error on /api/drafts/all
echo    - SQL column name conflicts
echo    - Wrong API endpoint called
echo.
echo ✅ Fixes applied:
echo    - Fixed SQL query column aliases
echo    - Added proper error handling  
echo    - Enhanced user role checking
echo    - Fixed API endpoint path
echo.

cd /d "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"

echo Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1

echo Starting server...
start "HTBIEUQUYET Server" cmd /k "echo 🚀 Starting server with fixes... && npm start"

echo Waiting for server startup...
timeout /t 8 /nobreak >nul

echo Opening application...
start http://localhost:3000

echo.
echo ============================================
echo   TEST INSTRUCTIONS:
echo ============================================
echo 1. Login as Admin or Manager
echo 2. Go to "Quản trị hệ thống"
echo 3. Click "Quản lý Dự thảo" tab
echo 4. Check console (F12) for errors
echo 5. Verify table loads without 500 error
echo 6. Test edit/delete functions
echo.
echo ============================================
echo   WHAT TO VERIFY:
echo ============================================
echo ✅ No 500 errors in console
echo ✅ Admin drafts table loads successfully
echo ✅ All draft data displays correctly
echo ✅ CreatedByName shows full names
echo ✅ Edit/Delete buttons work
echo ============================================
echo.
echo Press any key when ready to close...
pause >nul
