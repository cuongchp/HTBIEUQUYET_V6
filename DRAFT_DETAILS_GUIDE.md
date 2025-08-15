# HƯỚNG DẪN SỬ DỤNG TÍNH NĂNG XEM CHI TIẾT DỰ THẢO TỜ TRÌNH

## 🎯 Tổng quan tính năng
Tính năng "Xem chi tiết dự thảo tờ trình" đã được thiết kế và bổ sung hoàn chỉnh, cho phép người dùng:
- Xem thông tin chi tiết của dự thảo
- Đọc nội dung đầy đủ 
- Tải xuống tài liệu đính kèm
- Xem và thêm góp ý/bình luận
- Thống nhất hoặc hoàn thiện dự thảo

## 📋 Cách sử dụng

### 1. Truy cập tính năng
- Đăng nhập vào hệ thống
- Chọn module "Dự thảo tờ trình" từ menu chính
- Tại danh sách dự thảo, nhấn nút "Xem chi tiết" trên dự thảo muốn xem

### 2. Xem thông tin chi tiết
Modal sẽ hiển thị đầy đủ thông tin:
- **Thông tin cơ bản**: Tiêu đề, người tạo, ngày tạo, thời hạn góp ý
- **Trạng thái**: Hiển thị trạng thái hiện tại với badge màu sắc
- **Nội dung**: Nội dung chi tiết của dự thảo tờ trình
- **Tài liệu đính kèm**: Danh sách file có thể tải xuống
- **Góp ý**: Tất cả góp ý và bình luận của các thành viên

### 3. Thêm góp ý
- Nhấn nút "Thêm góp ý" (chỉ hiện khi còn thời hạn)
- Nhập nội dung góp ý vào ô text
- Nhấn "Gửi góp ý" để lưu

### 4. Quản lý dự thảo (dành cho quản trị viên)
- **Chỉnh sửa**: Mở form chỉnh sửa dự thảo
- **Thống nhất**: Đánh dấu dự thảo đã được thống nhất
- **Hoàn thiện**: Đánh dấu dự thảo đã hoàn thiện, kết thúc giai đoạn góp ý

## 🎨 Các trạng thái dự thảo

| Trạng thái | Màu sắc | Ý nghĩa |
|------------|---------|---------|
| 🔄 Bản nháp | Xám | Dự thảo mới tạo, chưa mở góp ý |
| 💬 Đang góp ý | Xanh dương | Mở để nhận góp ý từ thành viên |
| ✅ Đã thống nhất | Xanh lá | Được thống nhất, chuẩn bị hoàn thiện |
| 🏁 Đã hoàn thiện | Cyan | Hoàn thiện nội dung, sẵn sàng sử dụng |
| ⏰ Hết hạn góp ý | Vàng | Quá thời hạn góp ý |
| 📤 Đã công bố | Đen | Đã được công bố chính thức |
| ❌ Từ chối | Đỏ | Bị từ chối |

## 🔧 Tính năng kỹ thuật

### API Endpoints đã thêm:
- `GET /api/drafts/:id` - Lấy chi tiết dự thảo và comments
- `POST /api/drafts/:id/comment` - Thêm góp ý mới
- `POST /api/drafts/:id/approve` - Thống nhất dự thảo
- `POST /api/drafts/:id/finalize` - Hoàn thiện dự thảo

### JavaScript Functions đã thêm:
- `viewDraftDetails(draftId)` - Hiển thị modal chi tiết
- `renderDraftComments(comments)` - Render danh sách góp ý
- `getDraftStatusBadge(status)` - Tạo badge trạng thái
- `showAddCommentForm()` - Hiển thị form góp ý
- `submitComment(draftId)` - Gửi góp ý mới
- `approveDraft()` - Thống nhất dự thảo
- `finalizeDraft()` - Hoàn thiện dự thảo

### CSS Classes đã thêm:
- `.content-area` - Styling cho nội dung dự thảo
- `.comment-item` - Styling cho từng góp ý
- `.comment-avatar` - Avatar người góp ý
- `.comment-content` - Nội dung góp ý
- `#commentForm` - Form thêm góp ý mới

## 📱 Responsive Design
- **Desktop**: Modal full-width với layout 2 cột
- **Tablet**: Modal thu nhỏ, layout 1 cột
- **Mobile**: Modal full-screen, tối ưu cho cảm ứng

## 🧪 Test Instructions

### Khởi động test:
```bash
# Chạy file test
./test-draft-details.bat

# Hoặc thủ công:
node server.js
# Mở browser: http://localhost:3000
```

### Test Cases:
1. **Test xem chi tiết**:
   - Login với admin/admin123
   - Vào module "Dự thảo tờ trình"
   - Nhấn "Xem chi tiết" -> Modal phải mở
   - Kiểm tra hiển thị đầy đủ thông tin

2. **Test góp ý**:
   - Nhấn "Thêm góp ý" -> Form phải hiện
   - Nhập nội dung -> Nhấn "Gửi góp ý"
   - Kiểm tra góp ý được thêm vào danh sách

3. **Test quản lý**:
   - Nhấn "Thống nhất" -> Trạng thái cập nhật
   - Nhấn "Hoàn thiện" -> Trạng thái cập nhật
   - Kiểm tra thay đổi trong danh sách

4. **Test responsive**:
   - Thu nhỏ browser xuống mobile size
   - Kiểm tra modal hiển thị đúng
   - Test touch interaction

## ✅ Hoàn thành
- [x] Modal hiển thị chi tiết dự thảo
- [x] Xem và tải tài liệu đính kèm
- [x] Hệ thống góp ý và bình luận
- [x] Workflow thống nhất/hoàn thiện
- [x] Responsive design cho mobile
- [x] API endpoints đầy đủ
- [x] Error handling và validation
- [x] CSS styling chuyên nghiệp

🎉 **Tính năng đã sẵn sàng sử dụng!**
