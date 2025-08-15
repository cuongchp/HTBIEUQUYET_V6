# HƯỚNG DẪN KHẮC PHỤC LỖI XÓA DỰ THẢO

## Vấn đề hiện tại
- Khi click "Xóa" tại module "Dự thảo tờ trình" → Lỗi 500 Internal Server Error
- Log lỗi: "DELETE http://localhost:3000/api/drafts/18 500"

## Nguyên nhân có thể
1. **Trường soft delete chưa được thêm vào database**
2. **Foreign key constraints** (DraftComments phụ thuộc vào Drafts)
3. **Stored procedure chưa được tạo**

## Các bước khắc phục

### Bước 1: Kiểm tra cấu trúc database
```cmd
node test_delete_logic.js
```

### Bước 2: Nếu trường IsDeleted chưa có, chạy upgrade script
```cmd
sqlcmd -S DUONGVIETCUONG\SQLEXPRESS -d BIEUQUYET_CHP -E -i "database\soft_delete_upgrade.sql"
```

### Bước 3: Khởi động server và test
```cmd
npm start
```

### Bước 4: Test trong browser
1. Đăng nhập vào hệ thống
2. Vào "Dự thảo tờ trình"
3. Click "Xóa" một dự thảo bất kỳ
4. Kiểm tra console trong DevTools (F12)

## Logic đã được sửa

### routes/drafts.js - DELETE endpoint
```javascript
// Logic mới có fallback:
1. Thử soft delete trước (UPDATE IsDeleted = 1)
2. Nếu thất bại → fallback sang hard delete
3. Xóa comments trước (foreign key constraint)
4. Xóa draft sau
```

### Ưu điểm của logic mới:
- ✅ Hoạt động cả khi có và không có trường soft delete
- ✅ Tự động fallback nếu soft delete thất bại
- ✅ Xử lý foreign key constraints đúng cách
- ✅ Log chi tiết để debug

## Test cases

### Test Case 1: Soft Delete (nếu có trường IsDeleted)
```
Expected: 
- Draft được đánh dấu IsDeleted = 1
- Comments được đánh dấu IsDeleted = 1  
- Record được thêm vào RecycleBin
- Response: "Dự thảo đã được chuyển vào thùng rác"
```

### Test Case 2: Hard Delete (nếu không có trường IsDeleted)
```
Expected:
- Comments được xóa vĩnh viễn (DELETE FROM DraftComments)
- Draft được xóa vĩnh viễn (DELETE FROM Drafts)
- Response: "Dự thảo đã được xóa thành công"
```

## Troubleshooting

### Lỗi: "Invalid column name 'IsDeleted'"
**Nguyên nhân:** Trường soft delete chưa được thêm
**Giải pháp:** Chạy database upgrade script

### Lỗi: "DELETE statement conflicted with the REFERENCE constraint"
**Nguyên nhân:** Foreign key constraint DraftComments -> Drafts
**Giải pháp:** Logic đã được sửa để xóa comments trước

### Lỗi: "Cannot find table 'RecycleBin'"
**Nguyên nhân:** Bảng RecycleBin chưa được tạo
**Giải pháp:** Code đã có try-catch, sẽ bỏ qua lỗi này

## Kiểm tra kết quả

### Trong browser:
1. Draft biến mất khỏi danh sách
2. Không có lỗi 500 trong Network tab
3. Thông báo thành công được hiển thị

### Trong database (nếu soft delete):
```sql
-- Kiểm tra draft đã được soft delete
SELECT DraftID, Title, IsDeleted, DeletedDate, DeletedBy 
FROM Drafts 
WHERE DraftID = [ID_đã_xóa]

-- Kiểm tra RecycleBin
SELECT * FROM RecycleBin 
WHERE TableName = 'Drafts' AND RecordID = [ID_đã_xóa]
```

### Trong database (nếu hard delete):
```sql
-- Draft sẽ không còn tồn tại
SELECT COUNT(*) FROM Drafts WHERE DraftID = [ID_đã_xóa]
-- Kết quả: 0
```

---

**🚀 HÀNH ĐỘNG TIẾP THEO:**
1. Chạy `node test_delete_logic.js` để kiểm tra database
2. Nếu cần thiết, chạy database upgrade script
3. Khởi động server và test chức năng xóa
4. Báo cáo kết quả!
