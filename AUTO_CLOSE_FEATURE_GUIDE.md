# TÍNH NĂNG AUTO-CLOSE PHIẾU BIỂU QUYẾT

## 📋 Mô tả tính năng
Tự động đóng phiếu biểu quyết khi tất cả user được phân công đã hoàn thành biểu quyết, sau đó chuyển hướng user đến module "Kết quả biểu quyết".

## ⚙️ Cách hoạt động

### 1. Thời điểm kiểm tra
- Kiểm tra ngay sau khi user submit vote
- Không cần chờ cron job định kỳ

### 2. Logic kiểm tra
- **AssigneeType = 'All'**: Đếm tất cả user active (trừ Admin)
- **AssigneeType = 'Specific'**: Đếm user trong bảng VoteAssignees (chỉ những user active)

### 3. Điều kiện auto-close
- Số user đã vote >= Số user được phân công
- Phiếu đang có status = 'Open'
- Loại trừ user không active (IsActive = 0) hoặc đã xóa (IsDeleted = 1)

## 🔧 Triển khai kỹ thuật

### Backend (routes/votes.js)
```javascript
// Function kiểm tra và auto-close
async function checkAndAutoCloseVote(pool, voteId)

// Cập nhật route submit vote
router.post('/:id/vote', async (req, res) => {
  // ... submit vote logic
  const wasAutoClosed = await checkAndAutoCloseVote(pool, voteId);
  
  res.json({
    success: true,
    message: wasAutoClosed ? 'Tự động đóng phiếu' : 'Biểu quyết thành công',
    autoClosed: wasAutoClosed,
    redirectTo: wasAutoClosed ? 'endVote' : undefined
  });
});
```

### Frontend (app.js)
```javascript
// Xử lý response sau submit vote
if (data.autoClosed) {
  alert('🎉 Tất cả người dùng đã hoàn thành biểu quyết!');
  showModule('endVote'); // Redirect to results
  loadEndVotesList(); // Reload results list
}
```

## 📊 Database queries

### Đếm user cần biểu quyết (AssigneeType = 'All')
```sql
SELECT COUNT(*) FROM Users 
WHERE IsActive = 1 AND IsDeleted = 0 AND Role != 'Admin'
```

### Đếm user cần biểu quyết (AssigneeType = 'Specific')
```sql
SELECT COUNT(*) FROM Users u
INNER JOIN VoteAssignees va ON u.UserID = va.UserID
WHERE va.VoteID = @voteID AND u.IsActive = 1 AND u.IsDeleted = 0
```

### Đếm user đã biểu quyết
```sql
SELECT COUNT(DISTINCT vr.UserID) FROM VoteResults vr
INNER JOIN Users u ON vr.UserID = u.UserID
WHERE vr.VoteID = @voteID AND vr.IsDeleted = 0
```

## ✅ Test cases đã thực hiện

### Test 1: Phiếu Specific với 2 users
- ✅ User 1 vote → phiếu vẫn mở
- ✅ User 2 vote → phiếu tự động đóng
- ✅ Status chuyển từ 'Open' → 'Closed'

### Test 2: Xử lý user inactive
- ✅ User không active được loại trừ khỏi danh sách cần vote
- ✅ Phiếu có thể đóng mà không cần chờ user inactive

## 🎯 User Experience

### Khi submit vote thành công (chưa đủ người)
- Thông báo: "Biểu quyết thành công"
- Modal đóng, reload danh sách votes

### Khi submit vote và auto-close
- Thông báo: "Biểu quyết thành công! Phiếu đã được tự động đóng..."
- Modal đóng
- Notification: "🎉 Tất cả người dùng đã hoàn thành biểu quyết!"
- Auto-redirect đến module "Kết quả biểu quyết"

## 🔍 Logs và Debug
```
🔍 Checking if vote should auto-close: [voteId]
📊 Vote details: {id, type, title}
📈 Voting progress: [actual]/[expected] users have voted
🎉 All users have completed voting! Auto-closing vote...
✅ Vote automatically closed: [voteId]
```

## 📝 Lưu ý quan trọng
1. Chỉ áp dụng cho phiếu có status = 'Open'
2. Không ảnh hưởng đến phiếu đã đóng thủ công
3. Tương thích với hệ thống auto-close theo thời gian hiện có
4. User inactive/deleted được xử lý tự động
5. Frontend sẽ redirect và reload danh sách kết quả

## 🚀 Tương lai có thể mở rộng
- Notification real-time cho tất cả users khi phiếu auto-close
- Email notification khi phiếu đóng tự động
- Dashboard hiển thị thống kê auto-close
- Tùy chọn bật/tắt auto-close cho từng phiếu
