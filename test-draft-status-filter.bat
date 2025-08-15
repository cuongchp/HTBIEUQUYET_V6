@echo off
echo ============================================
echo   TESTING DRAFT STATUS FILTERING
echo ============================================
echo ✅ Implemented changes:
echo    - API endpoint now supports ?status=active/closed
echo    - loadActiveDrafts() calls /api/drafts?status=active
echo    - loadClosedDrafts() calls /api/drafts?status=closed
echo    - Added CommentStatus calculation based on CommentPeriod
echo.
echo 🔍 Testing endpoints:
echo.

echo Testing /api/drafts?status=active
curl -s http://localhost:3000/api/drafts?status=active | jq ".[] | {DraftID, Title, CommentStatus, IsCommentActive}"
echo.

echo Testing /api/drafts?status=closed  
curl -s http://localhost:3000/api/drafts?status=closed | jq ".[] | {DraftID, Title, CommentStatus, IsCommentActive}"
echo.

echo ============================================
echo   HOW TO TEST IN BROWSER:
echo ============================================
echo 1. Go to http://localhost:3000
echo 2. Login as admin
echo 3. Check "Dự thảo đang mở góp ý" tab
echo 4. Check "Dự thảo đã kết thúc góp ý" tab
echo 5. Verify proper separation of active/closed drafts
echo.
pause
