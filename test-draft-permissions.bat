@echo off
echo ============================================
echo   DRAFT PERMISSIONS SYSTEM TESTING
echo ============================================
echo ✅ Implementation completed:
echo    - Created DraftPermissions table
echo    - Updated backend API to save permissions
echo    - Updated frontend to collect viewer data
echo    - Added permission filtering for draft display
echo.
echo 📊 LOGIC RULES:
echo    - Admin: Sees ALL drafts (no restriction)
echo    - Draft Creator: Always sees own drafts
echo    - Selected Users: Only see drafts they were granted access to
echo    - Other Users: Only see drafts marked as "all users"
echo.
echo 🔍 Testing database structure:
echo.

echo Checking DraftPermissions table:
sqlcmd -S "localhost" -U sa -P 123456 -d "BIEUQUYET_CHP" -Q "SELECT TOP 3 * FROM DraftPermissions"
echo.

echo Checking Drafts table with ViewerType:
sqlcmd -S "localhost" -U sa -P 123456 -d "BIEUQUYET_CHP" -Q "SELECT TOP 3 DraftID, Title, ViewerType, CreatedBy FROM Drafts ORDER BY DraftID DESC"
echo.

echo ============================================
echo   MANUAL TESTING STEPS:
echo ============================================
echo 1. Go to http://localhost:3000
echo 2. Login as admin
echo 3. Click "Tạo dự thảo mới"
echo 4. Fill in title and content
echo 5. Select "Chọn người dùng cụ thể"
echo 6. Choose specific users
echo 7. Create draft
echo 8. Logout and login as different user
echo 9. Verify only selected users can see the draft
echo.
echo 📝 Expected behavior:
echo    - Selected users: Can see the draft
echo    - Non-selected users: Cannot see the draft
echo    - Admin: Can always see all drafts
echo    - Creator: Can always see own drafts
echo.
pause
