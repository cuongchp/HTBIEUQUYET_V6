@echo off
title Fixed Stack Overflow Error Test
echo ============================================
echo   TESTING STACK OVERFLOW FIX
echo ============================================
echo.
echo ❌ Previous error: "Maximum call stack size exceeded"
echo ✅ Fix applied: Removed recursive showNotification call
echo ✅ Added: Simple toast notification system
echo ✅ Added: CSS animations for toast
echo.

cd /d "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"

echo Killing existing processes...
taskkill /f /im node.exe >nul 2>&1

echo Starting server...
start "HTBIEUQUYET Server" cmd /k "echo 🚀 Starting server... && npm start"

echo Waiting for server startup...
timeout /t 8 /nobreak >nul

echo Opening application...
start http://localhost:3000

echo.
echo ============================================
echo   DETAILED TEST STEPS:
echo ============================================
echo 1. Login with admin/manager account
echo 2. Go to "Dự thảo tờ trình" section
echo 3. Click "Chỉnh sửa" on any draft
echo 4. Make changes and click "Lưu thay đổi"
echo 5. Check console (F12) - should be NO errors
echo 6. Look for toast notification (top-right)
echo 7. Modal should close automatically
echo 8. Table should refresh with changes
echo.
echo ============================================
echo   WHAT TO VERIFY:
echo ============================================
echo ✅ No "Maximum call stack size exceeded" error
echo ✅ Toast notification appears instead of alert
echo ✅ Modal closes after saving
echo ✅ Table refreshes with new data
echo ✅ No console errors at all
echo ============================================
echo.
pause
