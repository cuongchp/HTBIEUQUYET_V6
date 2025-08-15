# Hướng dẫn Soft Delete System - EVNCHP Voting System

## Tổng quan
Hệ thống đã được nâng cấp từ **Hard Delete** (xóa vĩnh viễn) sang **Soft Delete** (xóa mềm) để đảm bảo tính toàn vẹn dữ liệu và khả năng khôi phục.

## Tính năng chính

### 1. Soft Delete (Xóa mềm)
- **Nguyên lý**: Dữ liệu không bị xóa vĩnh viễn, chỉ được đánh dấu là đã xóa
- **Lợi ích**: 
  - Có thể khôi phục dữ liệu
  - Audit trail hoàn chình
  - Tránh mất dữ liệu do nhầm lẫn
  - Tuân thủ quy định bảo mật

### 2. Recycle Bin (Thùng rác)
- **Chức năng**: Quản lý tập trung các mục đã xóa mềm
- **Quyền truy cập**: Chỉ Admin
- **Tính năng**:
  - Xem danh sách các mục đã xóa
  - Khôi phục từng mục
  - Xóa vĩnh viễn từng mục
  - Làm trống toàn bộ thùng rác

## Cấu trúc Database

### Các trường được thêm vào mỗi bảng:
```sql
IsDeleted BIT DEFAULT 0           -- Đánh dấu đã xóa (0: chưa xóa, 1: đã xóa)
DeletedDate DATETIME NULL         -- Thời gian xóa
DeletedBy INT NULL                -- ID người thực hiện xóa
```

### Bảng RecycleBin:
```sql
RecycleBinID INT IDENTITY(1,1) PRIMARY KEY
TableName NVARCHAR(50) NOT NULL   -- Tên bảng chứa dữ liệu
RecordID INT NOT NULL             -- ID của record đã xóa
RecordTitle NVARCHAR(255)         -- Tiêu đề/tên của record
DeletedBy INT NOT NULL            -- ID người xóa
DeletedDate DATETIME NOT NULL     -- Thời gian xóa
CanRestore BIT DEFAULT 1          -- Có thể khôi phục không
```

## Stored Procedures

### 1. sp_SoftDeleteRecord
```sql
EXEC sp_SoftDeleteRecord 
  @TableName = 'Users',
  @RecordID = 123,
  @DeletedBy = 1,
  @RecordTitle = 'John Doe'
```

### 2. sp_RestoreRecord
```sql
EXEC sp_RestoreRecord 
  @TableName = 'Users',
  @RecordID = 123,
  @RestoredBy = 1
```

## API Endpoints

### Recycle Bin Management

#### 1. Lấy danh sách thùng rác
```
GET /api/recycle-bin
```
**Response:**
```json
[
  {
    "RecycleBinID": 1,
    "TableName": "Users",
    "RecordID": 123,
    "RecordTitle": "John Doe",
    "DeletedDate": "2025-01-20T10:30:00Z",
    "DeletedBy": "Admin",
    "TypeName": "Người dùng"
  }
]
```

#### 2. Khôi phục dữ liệu
```
POST /api/recycle-bin/restore/{tableName}/{recordId}
```

#### 3. Xóa vĩnh viễn
```
DELETE /api/recycle-bin/permanent/{tableName}/{recordId}
```

#### 4. Làm trống thùng rác
```
DELETE /api/recycle-bin/empty
```

#### 5. Thống kê thùng rác
```
GET /api/recycle-bin/stats
```

## Frontend Changes

### 1. Thay đổi thông báo xóa
**Trước:**
```javascript
"Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác."
```

**Sau:**
```javascript
"Bạn có chắc chắn muốn xóa? Dữ liệu sẽ được chuyển vào thùng rác và có thể khôi phục sau."
```

### 2. Menu mới
- Thêm menu "Thùng rác" chỉ cho Admin
- Icon: `fas fa-trash-restore`

### 3. Functions mới
```javascript
loadRecycleBin()           // Tải danh sách thùng rác
restoreItem()              // Khôi phục mục
viewDeletedItem()          // Xem chi tiết mục đã xóa
permanentDelete()          // Xóa vĩnh viễn
emptyRecycleBin()          // Làm trống thùng rác
```

## Workflow xóa dữ liệu

### 1. Khi người dùng nhấn "Xóa":
1. Hiển thị confirm dialog với thông báo mới
2. Gọi API DELETE như cũ
3. Backend thực hiện soft delete thay vì hard delete
4. Dữ liệu được đánh dấu `IsDeleted = 1`
5. Thông tin xóa được lưu vào bảng RecycleBin

### 2. Khi Admin vào Thùng rác:
1. Load danh sách từ view `vw_RecycleBin`
2. Hiển thị với các thao tác: Khôi phục, Chi tiết, Xóa vĩnh viễn

### 3. Khi khôi phục:
1. Gọi stored procedure `sp_RestoreRecord`
2. Đặt `IsDeleted = 0`, `DeletedDate = NULL`, `DeletedBy = NULL`
3. Xóa khỏi bảng RecycleBin

### 4. Khi xóa vĩnh viễn:
1. Thực hiện hard delete từ database
2. Xóa khỏi bảng RecycleBin
3. **Không thể hoàn tác**

## Query Examples

### 1. Lấy dữ liệu chưa xóa:
```sql
-- Trước
SELECT * FROM Users ORDER BY CreatedDate DESC

-- Sau  
SELECT * FROM Users WHERE IsDeleted = 0 ORDER BY CreatedDate DESC
```

### 2. Lấy dữ liệu đã xóa:
```sql
SELECT * FROM Users WHERE IsDeleted = 1 ORDER BY DeletedDate DESC
```

### 3. Thống kê thùng rác:
```sql
SELECT 
  TableName,
  COUNT(*) as Count
FROM RecycleBin 
WHERE CanRestore = 1
GROUP BY TableName
```

## Testing

### 1. Test Soft Delete:
1. Đăng nhập với tài khoản Admin
2. Vào module "Dự thảo tờ trình" 
3. Xóa một dự thảo → Kiểm tra thông báo mới
4. Vào "Thùng rác" → Kiểm tra dự thảo xuất hiện

### 2. Test Restore:
1. Trong thùng rác, nhấn "Khôi phục" một mục
2. Quay lại module gốc → Kiểm tra mục đã được khôi phục

### 3. Test Permanent Delete:
1. Trong thùng rác, nhấn "Xóa vĩnh viễn"
2. Confirm 2 lần → Kiểm tra mục biến mất khỏi thùng rác

## Security & Permissions

### 1. Quyền truy cập:
- **Soft Delete**: Theo quyền module gốc
- **Recycle Bin**: Chỉ Admin (user_management permission)
- **Restore**: Chỉ Admin
- **Permanent Delete**: Chỉ Admin

### 2. Audit Trail:
- Lưu thông tin người xóa (`DeletedBy`)
- Lưu thời gian xóa (`DeletedDate`)
- Lưu trong bảng RecycleBin để audit

### 3. Data Validation:
- Kiểm tra quyền trước khi thao tác
- Validate table name để tránh SQL injection
- Chỉ allow các bảng được định nghĩa trước

## Performance Optimization

### 1. Indexes được tạo:
```sql
CREATE INDEX IX_Users_IsDeleted ON Users(IsDeleted)
CREATE INDEX IX_Drafts_IsDeleted ON Drafts(IsDeleted)
CREATE INDEX IX_Votes_IsDeleted ON Votes(IsDeleted)
-- etc...
```

### 2. Query optimization:
- Tất cả query đều thêm filter `WHERE IsDeleted = 0`
- Sử dụng view `vw_RecycleBin` cho thùng rác

## Maintenance

### 1. Cleanup job (khuyến nghị):
```sql
-- Tự động xóa các mục đã xóa mềm > 90 ngày
DELETE FROM RecycleBin 
WHERE DeletedDate < DATEADD(day, -90, GETDATE())
```

### 2. Monitoring:
- Monitor size của bảng RecycleBin
- Alert khi số lượng mục trong thùng rác quá lớn

## Troubleshooting

### 1. Nếu không thấy menu Thùng rác:
- Kiểm tra user có permission `user_management`
- Kiểm tra role là `Admin`

### 2. Nếu không khôi phục được:
- Kiểm tra `CanRestore = 1` trong RecycleBin
- Kiểm tra foreign key constraints

### 3. Nếu lỗi khi xóa vĩnh viễn:
- Kiểm tra cascading deletes
- Xóa theo thứ tự phụ thuộc

## Backup Strategy

### 1. Trước khi nâng cấp:
```sql
-- Backup database
BACKUP DATABASE BIEUQUYET_CHP TO DISK = 'backup_before_soft_delete.bak'
```

### 2. Test rollback:
- Giữ bản backup để rollback nếu cần
- Test đầy đủ trước khi deploy production

---

**Lưu ý quan trọng:**
- Soft Delete là default behavior mới
- Hard Delete chỉ thực hiện qua Recycle Bin với xác nhận 2 lần
- Tất cả queries phải được cập nhật để filter `IsDeleted = 0`
