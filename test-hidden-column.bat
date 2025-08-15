@echo off
echo ============================================
echo   HIDDEN "NGƯỜI KẾT THÚC" COLUMN UPDATE
echo ============================================
echo ✅ Changes completed:
echo    - Hidden table header "Người kết thúc" in index.html
echo    - Hidden corresponding data cell in app.js
echo    - Used HTML comments to preserve code
echo.
echo 📊 BEFORE:
echo    Columns: # ^| Tiêu đề ^| Ngày tạo ^| Ngày kết thúc ^| Người kết thúc ^| Số góp ý ^| Hành động
echo.
echo 📊 AFTER:
echo    Columns: # ^| Tiêu đề ^| Ngày tạo ^| Ngày kết thúc ^| Số góp ý ^| Hành động
echo.
echo ============================================
echo   VERIFY CHANGES:
echo ============================================
echo 1. Go to http://localhost:3000
echo 2. Login as admin
echo 3. Navigate to "Dự thảo đã kết thúc góp ý" tab
echo 4. Verify "Người kết thúc" column is hidden
echo 5. Check table alignment is correct
echo.
echo 🔧 TO RESTORE COLUMN (if needed):
echo    - Uncomment lines in index.html and app.js
echo    - Remove ^<^!^-^- ^-^-^> around the column code
echo.
pause
