@echo off
echo ============================================
echo   TESTING CLOSED DATE DISPLAY FIX
echo ============================================
echo ✅ Fixed issues:
echo    - Added CalculatedEndDate to SQL query
echo    - Mapped to ClosedDate in response  
echo    - Fixed frontend filtering logic
echo    - Added null check for date display
echo.
echo 🔍 Testing API response:
echo.

echo Testing /api/drafts?status=closed
curl -s "http://localhost:3000/api/drafts?status=closed" | jq ".[] | {DraftID, Title, CreatedDate, ClosedDate, CommentStatus}"
echo.

echo ============================================
echo   EXPECTED RESULTS:
echo ============================================
echo - ClosedDate should show actual calculated end date
echo - Not "N/A" anymore
echo - Format: DD/MM/YYYY HH:MM
echo.
echo HOW TO VERIFY:
echo 1. Go to http://localhost:3000
echo 2. Login as admin  
echo 3. Go to "Dự thảo đã kết thúc góp ý" tab
echo 4. Check "Ngày kết thúc" column shows dates
echo.
pause
