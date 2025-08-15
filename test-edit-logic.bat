@echo off
title Test Edit Draft Logic Fix
echo ============================================
echo   TESTING EDIT DRAFT LOGIC FIX
echo ============================================
echo.
echo Changes made:
echo ✅ Fixed updateDraft() to reload correct lists
echo ✅ Fixed deleteDraft() to reload correct lists  
echo ✅ Enhanced modal close logic
echo ✅ Improved notification handling
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
echo   TEST STEPS:
echo ============================================
echo 1. Login to application (admin/manager)
echo 2. Go to "Dự thảo tờ trình" section
echo 3. Click "Chỉnh sửa" on any draft
echo 4. Make some changes
echo 5. Click "Lưu thay đổi"
echo 6. Check:
echo    - Modal should close automatically
echo    - Table should refresh with changes
echo    - Success notification should show
echo    - No console errors
echo ============================================
echo.
echo Press CTRL+C to stop, or any key to continue...
pause >nul
