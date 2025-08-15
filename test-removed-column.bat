@echo off
title Test Removed Status Column
echo ============================================
echo   TESTING REMOVED STATUS COLUMN
echo ============================================
echo.
echo Changes made:
echo ✅ Removed "Trạng thái" column from header
echo ✅ Updated loadActiveDrafts() function
echo ✅ Updated displayDrafts() function
echo ✅ Fixed colspan in error messages
echo.

cd /d "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"

echo Starting server...
start "Server" cmd /k "npm start"

echo Waiting for server...
timeout /t 5 /nobreak >nul

echo Opening application...
start http://localhost:3000

echo.
echo ============================================
echo   TEST INSTRUCTIONS:
echo ============================================
echo 1. Login to the application
echo 2. Go to "Dự thảo tờ trình" section
echo 3. Check "Dự thảo đang mở góp ý" tab
echo 4. Verify "Trạng thái" column is removed
echo 5. Check table still displays correctly
echo 6. Test edit/delete buttons work
echo ============================================
echo.
pause
