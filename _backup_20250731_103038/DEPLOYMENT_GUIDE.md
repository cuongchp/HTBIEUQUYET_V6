# DEPLOYMENT GUIDE - SOFT DELETE SYSTEM

## Checklist sau khi nâng cấp

### ✅ 1. Database Schema Update
- [x] Thêm trường soft delete vào tất cả bảng chính
- [x] Tạo bảng RecycleBin
- [x] Tạo stored procedures sp_SoftDeleteRecord và sp_RestoreRecord  
- [x] Tạo view vw_RecycleBin
- [x] Tạo indexes cho hiệu suất

### ✅ 2. Backend API Updates
- [x] Cập nhật tất cả routes để sử dụng soft delete
- [x] Thêm API routes cho Recycle Bin (/api/recycle-bin)
- [x] Cập nhật queries để filter IsDeleted = 0
- [x] Thêm middleware authentication cho recycle bin

### ✅ 3. Frontend Updates  
- [x] Thay đổi thông báo xóa từ "không thể hoàn tác" thành "có thể khôi phục"
- [x] Thêm menu Thùng rác cho Admin
- [x] Tạo UI module recycle bin với các chức năng restore/permanent delete
- [x] Cập nhật các function delete trong app.js

### ✅ 4. Documentation
- [x] Tạo hướng dẫn sử dụng (SOFT_DELETE_GUIDE.md)
- [x] Tạo file deployment guide
- [x] Tạo scripts test và start server

## Các bước để khởi động hệ thống

### 1. Chạy Database Upgrade Script
```cmd
sqlcmd -S DUONGVIETCUONG\SQLEXPRESS -d BIEUQUYET_CHP -E -i "database\soft_delete_upgrade.sql"
```

### 2. Kiểm tra Database
```cmd
node test_connection.js
```

### 3. Khởi động Server
Chọn một trong các cách sau:

**Cách 1: Tự động**
```cmd
start_server.bat
```

**Cách 2: Manual**
```cmd
npm install
npm start
```

**Cách 3: Development mode**
```cmd
npm run dev
```

### 4. Kiểm tra hoạt động
1. Mở trình duyệt: http://localhost:3000
2. Đăng nhập với tài khoản Admin
3. Kiểm tra menu "Thùng rác" xuất hiện
4. Test chức năng xóa mềm và khôi phục

## Test Cases

### Test 1: Soft Delete Basic
1. Vào module "Dự thảo tờ trình"
2. Xóa một dự thảo bất kỳ
3. ✅ Thông báo phải là "Dữ liệu sẽ được chuyển vào thùng rác và có thể khôi phục sau"
4. ✅ Dự thảo biến mất khỏi danh sách chính

### Test 2: Recycle Bin
1. Vào menu "Thùng rác"
2. ✅ Dự thảo vừa xóa phải xuất hiện trong danh sách
3. ✅ Có các nút "Chi tiết", "Khôi phục", "Xóa vĩnh viễn"

### Test 3: Restore Functionality  
1. Click "Khôi phục" trên một mục
2. ✅ Thông báo thành công
3. ✅ Mục biến mất khỏi thùng rác
4. ✅ Mục xuất hiện lại trong module gốc

### Test 4: Permanent Delete
1. Click "Xóa vĩnh viễn" trên một mục
2. ✅ Thông báo cảnh báo "KHÔNG THỂ HOÀN TÁC"
3. ✅ Yêu cầu xác nhận 2 lần
4. ✅ Mục biến mất hoàn toàn

### Test 5: Admin Permission
1. Đăng nhập với tài khoản User (không phải Admin)
2. ✅ Menu "Thùng rác" KHÔNG xuất hiện
3. ✅ API /api/recycle-bin trả về lỗi 403 Forbidden

## Troubleshooting

### Lỗi: Menu Thùng rác không xuất hiện
**Nguyên nhân:** User không có quyền Admin
**Giải pháp:** 
1. Kiểm tra Role trong database: `SELECT Role FROM Users WHERE Username = 'your_username'`
2. Cập nhật quyền: `UPDATE Users SET Role = 'Admin' WHERE Username = 'your_username'`

### Lỗi: Không khôi phục được
**Nguyên nhân:** CanRestore = 0 hoặc foreign key constraints
**Giải pháp:**
1. Kiểm tra: `SELECT * FROM RecycleBin WHERE CanRestore = 0`
2. Xóa dependencies trước khi khôi phục parent record

### Lỗi: Database connection failed
**Nguyên nhân:** SQL Server service không chạy hoặc connection string sai
**Giải pháp:**
1. Start SQL Server service
2. Kiểm tra server name trong config
3. Kiểm tra credentials (sa/123456)

### Lỗi: Stored procedure không tìm thấy
**Nguyên nhân:** Database upgrade script chưa chạy hoặc chạy không thành công
**Giải pháp:**
1. Chạy lại: `sqlcmd -S DUONGVIETCUONG\SQLEXPRESS -d BIEUQUYET_CHP -E -i "database\soft_delete_upgrade.sql"`
2. Kiểm tra: `SELECT name FROM sys.procedures WHERE name LIKE '%soft%'`

## Performance Notes

### Query Performance
- Tất cả query đã được thêm filter `WHERE IsDeleted = 0`
- Indexes đã được tạo cho cột IsDeleted
- RecycleBin table được optimize cho việc tìm kiếm

### Recommended Maintenance
```sql
-- Cleanup job (chạy hàng tuần)
DELETE FROM RecycleBin 
WHERE DeletedDate < DATEADD(day, -90, GETDATE())
AND CanRestore = 1

-- Reindex (chạy hàng tháng)  
ALTER INDEX ALL ON Users REBUILD
ALTER INDEX ALL ON Drafts REBUILD
ALTER INDEX ALL ON Votes REBUILD
```

## Backup & Recovery

### Trước khi deploy production
```sql
BACKUP DATABASE BIEUQUYET_CHP 
TO DISK = 'C:\Backup\BIEUQUYET_CHP_before_soft_delete.bak'
```

### Rollback plan (nếu cần)
```sql
RESTORE DATABASE BIEUQUYET_CHP 
FROM DISK = 'C:\Backup\BIEUQUYET_CHP_before_soft_delete.bak'
REPLACE
```

## Security Considerations

### Permissions
- Recycle Bin: Chỉ Admin
- Soft Delete: Theo quyền module gốc
- Permanent Delete: Chỉ Admin với double confirmation

### Audit Trail
- Tất cả soft delete được log trong RecycleBin
- Thông tin người xóa (DeletedBy) được lưu trữ
- Timestamp chính xác (DeletedDate)

## Final Checklist

- [ ] Database upgrade script đã chạy thành công
- [ ] Server khởi động không lỗi
- [ ] Test soft delete hoạt động
- [ ] Test recycle bin hoạt động  
- [ ] Test restore hoạt động
- [ ] Test permanent delete hoạt động
- [ ] Test permissions (Admin vs User)
- [ ] Performance acceptable
- [ ] Backup created

---

**🎉 SOFT DELETE SYSTEM DEPLOYMENT COMPLETED!**

Hệ thống đã được nâng cấp thành công từ Hard Delete sang Soft Delete với đầy đủ tính năng Recycle Bin và khả năng khôi phục dữ liệu.
