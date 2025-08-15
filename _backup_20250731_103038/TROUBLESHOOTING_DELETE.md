# TROUBLESHOOTING - Lỗi xóa dự thảo

## 🚨 Vấn đề hiện tại
- Click "Xóa" ở module "Dự thảo tờ trình" → Lỗi 500 Internal Server Error
- Console log: "DELETE http://localhost:3000/api/drafts/17 500"

## 🔧 Các bước troubleshooting

### Bước 1: Khởi động server với debug mode
```cmd
start_debug.bat
```
Hoặc:
```cmd
cd "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"
node server.js
```

### Bước 2: Test database connection
Mở browser và truy cập: `http://localhost:3000/api/test-db`

**Expected output:**
```json
{
  "success": true,
  "pool": true,
  "userCount": [số],
  "server": "DUONGVIETCUONG\\SQLEXPRESS",
  "database": "BIEUQUYET_CHP"
}
```

**Nếu lỗi:** Kiểm tra SQL Server service và connection string

### Bước 3: Test drafts query
Truy cập: `http://localhost:3000/api/test-drafts`

**Expected output:**
```json
{
  "success": true,
  "pool": true,
  "draftsCount": [số],
  "drafts": [...]
}
```

### Bước 4: Test specific draft
Truy cập: `http://localhost:3000/api/test-drafts?id=17`

**Expected output:**
```json
{
  "success": true,
  "specificDraft": {
    "DraftID": 17,
    "Title": "...",
    ...
  },
  "testedId": "17"
}
```

### Bước 5: Login và test delete
1. Đăng nhập vào hệ thống: `http://localhost:3000`
2. Vào "Dự thảo tờ trình"
3. Mở Developer Tools (F12) → Console tab
4. Click "Xóa" một dự thảo
5. Xem console logs chi tiết

## 📊 Debug logs được thêm

### Server console sẽ hiển thị:
```
=== DELETE DRAFT DEBUG ===
Session user: { UserID: 1, Username: "admin", ... }
Draft ID: 17
Pool available: true
🔄 Starting delete process for draft ID: 17
🔍 Checking if draft exists...
✅ Found draft: [Title]
🔄 Deleting related comments...
✅ Deleted comments: 0
🔄 Deleting draft...
✅ Delete result: 1
🎉 Draft deleted successfully
```

### Nếu có lỗi, sẽ hiển thị:
```
❌ Delete draft error: [Error message]
Error details: {
  message: "...",
  code: "...",
  number: ...,
  state: ...,
  procedure: "..."
}
```

## 🔍 Các lỗi thường gặp và cách khắc phục

### 1. Authentication Error
**Lỗi:** `Authentication required`
**Nguyên nhân:** Session hết hạn
**Khắc phục:** Đăng nhập lại

### 2. Database Connection Error
**Lỗi:** `Database connection not available`
**Nguyên nhân:** SQL Server không chạy hoặc connection string sai
**Khắc phục:** 
- Kiểm tra SQL Server service
- Kiểm tra server name trong config

### 3. Foreign Key Constraint Error
**Lỗi:** `DELETE statement conflicted with the REFERENCE constraint`
**Nguyên nhân:** Còn comments liên quan
**Khắc phục:** Code đã được sửa để xóa comments trước

### 4. Draft Not Found
**Lỗi:** `Không tìm thấy dự thảo`
**Nguyên nhân:** Draft ID không tồn tại
**Khắc phục:** Refresh page và thử lại

### 5. Permission Error
**Lỗi:** `Insufficient permissions`
**Nguyên nhân:** User không có quyền xóa
**Khắc phục:** Đăng nhập với tài khoản có quyền

## 📝 Kiểm tra Database

### Query kiểm tra draft tồn tại:
```sql
SELECT * FROM Drafts WHERE DraftID = 17
```

### Query kiểm tra comments liên quan:
```sql
SELECT * FROM DraftComments WHERE DraftID = 17
```

### Query kiểm tra users:
```sql
SELECT UserID, Username, FullName, Role FROM Users
```

## 🚀 Hành động tiếp theo

1. **Chạy start_debug.bat**
2. **Test từng endpoint theo thứ tự**
3. **Đăng nhập và test delete với F12 mở**
4. **Báo cáo kết quả cụ thể:**
   - Console logs từ server
   - Error messages từ browser
   - Screenshots nếu cần

## 💡 Tips debug

1. **Luôn mở F12 Developer Tools** khi test
2. **Kiểm tra cả Console và Network tabs**
3. **Chụp screenshot nếu có lỗi**
4. **Copy/paste exact error messages**
5. **Kiểm tra server console logs**

---

**🎯 MỤC TIÊU:** Xác định chính xác điểm lỗi và khắc phục để xóa draft thành công!
