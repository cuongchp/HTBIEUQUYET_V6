# DEBUG USER MANAGEMENT - Lỗi tải danh sách người dùng

## 🚨 Vấn đề hiện tại
- Lỗi "GET http://localhost:3000/api/admin/users 500 (Internal Server Error)"
- Console error: "TypeError: users.forEach is not a function"

## 🔧 Các bước debug đã thực hiện

### ✅ 1. Sửa backend API `/api/admin/users`:
- Thêm kiểm tra column `IsDeleted` tồn tại
- Fallback query nếu column chưa có
- Enhanced error handling và logging
- Đảm bảo luôn trả về array

### ✅ 2. Sửa frontend `loadUsers()`:
- Kiểm tra response status
- Validate data type (phải là array)
- Enhanced error handling
- Better console logging
- Safe rendering với null checks

### ✅ 3. Thêm test endpoints:
- `/api/test-db`: Test database connection cơ bản
- `/api/test-admin-users`: Test users query trực tiếp (không cần auth)

### ✅ 4. Thêm test functions trong UI:
- `testDbConnection()`: Test DB connection
- `testDbConnectionDirect()`: Test admin users query

## 🚀 Bước tiếp theo để debug

### Bước 1: Khởi động server
```cmd
cd "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"
node server.js
```

### Bước 2: Test database connection
Mở browser: `http://localhost:3000/api/test-db`

**Expected result:**
```json
{
  "success": true,
  "pool": true,
  "userCount": [số],
  "server": "DUONGVIETCUONG\\SQLEXPRESS",
  "database": "BIEUQUYET_CHP"
}
```

### Bước 3: Test admin users query
Mở browser: `http://localhost:3000/api/test-admin-users`

**Expected result:**
```json
{
  "success": true,
  "pool": true,
  "usersCount": [số],
  "users": [...],
  "message": "Admin users test successful"
}
```

### Bước 4: Test trong UI
1. Đăng nhập vào hệ thống
2. Vào "Quản trị Hệ thống" → Tab "Quản lý Người dùng"
3. Click nút "Test Direct" → Kiểm tra alert message
4. Click nút "Test DB" → Kiểm tra alert message
5. Mở F12 → Console để xem logs chi tiết

### Bước 5: Debug UI loading
1. Với F12 mở, reload trang admin
2. Xem console logs từ `loadUsers()`
3. Kiểm tra Network tab cho request `/api/admin/users`

## 📊 Debug logs mong đợi

### Server console:
```
=== GET /users called ===
Session user: { UserID: 1, Username: "admin", ... }
🔍 Checking if IsDeleted column exists...
IsDeleted column exists: true/false
🔄 Executing users query...
✅ Users query result: X users found
```

### Browser console:
```
🔄 Loading users...
Response status: 200
Users data received: [array of users]
Users type: object
Is array? true
✅ Users table updated successfully
```

## 🔍 Troubleshooting

### Lỗi: "No database pool available"
**Nguyên nhân:** SQL Server không chạy hoặc connection failed
**Giải pháp:** 
- Start SQL Server service
- Kiểm tra connection string trong server.js

### Lỗi: "Authentication required"
**Nguyên nhân:** Session hết hạn hoặc không đăng nhập
**Giải pháp:** 
- Đăng nhập lại
- Kiểm tra session middleware

### Lỗi: "Access denied"
**Nguyên nhân:** User không phải Admin
**Giải pháp:** 
- Đăng nhập với tài khoản Admin
- Kiểm tra Role trong database

### Lỗi: "Invalid column name 'IsDeleted'"
**Nguyên nhân:** Column chưa được thêm vào database
**Giải pháp:** 
- Code đã có fallback, sẽ skip column này
- Hoặc chạy database upgrade script

### Lỗi: "TypeError: users.forEach is not a function"
**Nguyên nhân:** API trả về object thay vì array
**Giải pháp:** 
- Code đã được sửa để validate
- Sẽ hiển thị error message thay vì crash

## 💡 Quick fixes

### Nếu cần reset session:
```javascript
// Trong browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Nếu cần test trực tiếp API:
```javascript
// Trong browser console
fetch('/api/admin/users')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

**🎯 MỤC TIÊU:** Xác định chính xác điểm lỗi và fix để tải được danh sách users!

**📞 HỖ TRỢ:** Nếu vẫn lỗi, báo cáo:
1. Kết quả của test endpoints
2. Console logs từ browser
3. Server console logs
4. Screenshots nếu cần
