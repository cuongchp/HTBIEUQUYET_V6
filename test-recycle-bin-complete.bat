@echo off
echo ============================================
echo   KIỂM TRA HỆ THỐNG THÙNG RÁC
echo ============================================
echo.

echo 🔍 Checking stored procedures and database structure...
node check-stored-procedures.js
echo.

echo 📊 Current recycle bin status...
node check-recycle-bin.js
echo.

echo ============================================
echo   HƯỚNG DẪN TEST THỦ CÔNG
echo ============================================
echo.
echo 1. Mở browser: http://localhost:3000
echo 2. Đăng nhập với tài khoản admin
echo 3. Vào module "Dự thảo tờ trình"
echo 4. Tạo một dự thảo test để xóa
echo 5. Click "Xóa" trên dự thảo đó
echo    → Thông báo: "Dự thảo sẽ được chuyển vào thùng rác"
echo 6. Vào menu "Thùng rác" (chỉ Admin thấy)
echo 7. Kiểm tra dự thảo vừa xóa có xuất hiện không
echo.
echo 🎯 KẾT QUẢ MONG MUỐN:
echo ✓ Thông báo xóa mới: "chuyển vào thùng rác"
echo ✓ Dự thảo biến mất khỏi danh sách chính
echo ✓ Dự thảo xuất hiện trong thùng rác
echo ✓ Có thể khôi phục hoặc xóa vĩnh viễn
echo.
echo ============================================
echo   TROUBLESHOOTING
echo ============================================
echo.
echo Nếu thùng rác vẫn trống:
echo 1. Kiểm tra console logs khi xóa dự thảo
echo 2. Kiểm tra stored procedure có chạy không
echo 3. Kiểm tra bảng RecycleBin có dữ liệu không
echo.
pause
@echo off
echo ============================================
echo   KIỂM TRA HỆ THỐNG THÙNG RÁC
echo ============================================
echo.

echo 🔍 Checking stored procedures and database structure...
node check-stored-procedures.js
echo.

echo 📊 Current recycle bin status...
node check-recycle-bin.js
echo.

echo ============================================
echo   HƯỚNG DẪN TEST THỦ CÔNG
echo ============================================
echo.
echo 1. Mở browser: http://localhost:3000
echo 2. Đăng nhập với tài khoản admin
echo 3. Vào module "Dự thảo tờ trình"
echo 4. Tạo một dự thảo test để xóa
echo 5. Click "Xóa" trên dự thảo đó
echo    → Thông báo: "Dự thảo sẽ được chuyển vào thùng rác"
echo 6. Vào menu "Thùng rác" (chỉ Admin thấy)
echo 7. Kiểm tra dự thảo vừa xóa có xuất hiện không
echo.
echo 🎯 KẾT QUẢ MONG MUỐN:
echo ✓ Thông báo xóa mới: "chuyển vào thùng rác"
echo ✓ Dự thảo biến mất khỏi danh sách chính
echo ✓ Dự thảo xuất hiện trong thùng rác
echo ✓ Có thể khôi phục hoặc xóa vĩnh viễn
echo.
echo ============================================
echo   TROUBLESHOOTING
echo ============================================
echo.
echo Nếu thùng rác vẫn trống:
echo 1. Kiểm tra console logs khi xóa dự thảo
echo 2. Kiểm tra stored procedure có chạy không
echo 3. Kiểm tra bảng RecycleBin có dữ liệu không
echo.
pause
