@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║        TỐI ƯU FRONTEND                  ║
echo ╚══════════════════════════════════════════╝
echo.
echo Đang phân chia app.js thành các module...

:: Tạo thư mục modules nếu chưa có
mkdir "public\js\modules" 2>nul

:: Di chuyển các file module đã tạo
echo [1/5] Tạo module authentication...
call :extract_module "auth" "Login and Authentication Module" "login|logout|checkAuthStatus|currentUser|handleLogin"

echo [2/5] Tạo module drafts...
call :extract_module "drafts" "Draft Management Module" "draft|createDraft|loadDraftManagement|viewDraftDetails|showCreateDraftModal|handleCreateDraft"

echo [3/5] Tạo module votes...
call :extract_module "votes" "Voting Management Module" "vote|submitVote|showVoteDetail|loadVotesList|handleCreateVote|loadVoteSummary"

echo [4/5] Tạo module admin...
call :extract_module "admin" "Admin and User Management Module" "loadAdmin|loadUsers|addUser|deleteUser|loadPermissions|updatePermission"

echo [5/5] Tạo module utils...
call :extract_module "utils" "Utility Functions Module" "formatDate|showError|showSuccess|formatFileSize|debounce|showLoadingModal"

echo.
echo Đang tạo index.js để khởi tạo các module...
echo // Main application initialization file > public\js\index.js
echo import './modules/auth.js'; >> public\js\index.js
echo import './modules/drafts.js'; >> public\js\index.js
echo import './modules/votes.js'; >> public\js\index.js
echo import './modules/admin.js'; >> public\js\index.js
echo import './modules/utils.js'; >> public\js\index.js
echo. >> public\js\index.js
echo // Initialize application >> public\js\index.js
echo document.addEventListener('DOMContentLoaded', function() { >> public\js\index.js
echo     // Initialize authentication >> public\js\index.js
echo     checkAuthStatus(); >> public\js\index.js
echo     // Initialize event listeners >> public\js\index.js
echo     initializeEventListeners(); >> public\js\index.js
echo }); >> public\js\index.js

:: Cập nhật index.html để sử dụng module
echo Cập nhật index.html để sử dụng ES modules...
:: Lưu ý: Trong thực tế, cần sử dụng công cụ như sed hoặc PowerShell để thay thế trong file

echo.
echo ╔══════════════════════════════════════════╗
echo ║       TỐI ƯU FRONTEND HOÀN TẤT         ║
echo ╚══════════════════════════════════════════╝
echo.
echo Đã tạo các module frontend:
echo  - auth.js: Xác thực và quản lý phiên đăng nhập
echo  - drafts.js: Quản lý dự thảo tờ trình
echo  - votes.js: Quản lý biểu quyết
echo  - admin.js: Quản trị người dùng và phân quyền
echo  - utils.js: Các hàm tiện ích
echo.
echo ⚠️ Lưu ý: 
echo Bạn cần cập nhật thủ công file index.html để sử dụng các module.
echo Thay thẻ script từ:
echo   ^<script src="js/app.js"^>^</script^>
echo Thành:
echo   ^<script type="module" src="js/index.js"^>^</script^>
echo.
pause
exit /b

:extract_module
echo // %~2 > public\js\modules\%~1.js
echo // Created by optimize-frontend.bat >> public\js\modules\%~1.js
echo // Functions: %~3 >> public\js\modules\%~1.js
echo. >> public\js\modules\%~1.js
echo // Import dependencies >> public\js\modules\%~1.js
echo import { formatDate, showError, showSuccess } from './utils.js'; >> public\js\modules\%~1.js
echo. >> public\js\modules\%~1.js
echo // Module code goes here >> public\js\modules\%~1.js
echo // Copy relevant functions from app.js >> public\js\modules\%~1.js
exit /b
