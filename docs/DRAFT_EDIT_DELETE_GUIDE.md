# Hướng dẫn Tính năng Chỉnh sửa và Xóa Dự thảo Tờ trình

## 🎯 Tổng quan

Hệ thống đã được bổ sung tính năng **Chỉnh sửa** và **Xóa** dự thảo tờ trình, cho phép người dùng quản lý dự thảo một cách linh hoạt và hiệu quả.

## ✨ Tính năng mới

### 1. Chỉnh sửa Dự thảo
- **Mục đích**: Cho phép sửa đổi nội dung, tiêu đề, trạng thái và file đính kèm
- **Quyền hạn**: Chỉ người tạo dự thảo hoặc Admin/Manager mới có thể chỉnh sửa
- **Giao diện**: Modal popup với form đầy đủ thông tin

### 2. Xóa Dự thảo  
- **Mục đích**: Xóa các dự thảo không cần thiết hoặc sai sót
- **Quyền hạn**: Chỉ người tạo dự thảo hoặc Admin/Manager mới có thể xóa
- **Bảo mật**: Có xác nhận trước khi xóa để tránh thao tác nhầm lẫn

### 3. Xem Chi tiết Dự thảo
- **Mục đích**: Hiển thị thông tin đầy đủ về dự thảo và các góp ý
- **Giao diện**: Modal popup với layout đẹp mắt, dễ đọc

## 🚀 Cách sử dụng

### Truy cập Quản lý Dự thảo

#### Phương án 1: Từ Menu Chính
1. Đăng nhập vào hệ thống
2. Click vào **"Dự Thảo Tờ Trình"** trên menu chính
3. Chọn tab **"Dự thảo đang mở góp ý"** hoặc **"Dự thảo đã kết thúc góp ý"**

#### Phương án 2: Từ Phần Admin (Dành cho Admin/Manager)
1. Đăng nhập với tài khoản Admin/Manager
2. Click vào **"Quản trị Hệ thống"**
3. Chọn tab **"Quản lý Dự thảo"**
4. Có thể xem và quản lý tất cả dự thảo trong hệ thống

### Chỉnh sửa Dự thảo

1. **Tìm dự thảo cần chỉnh sửa**
   - Từ danh sách dự thảo, tìm dự thảo cần chỉnh sửa
   - Hoặc sử dụng bộ lọc tìm kiếm (trong phần Admin)

2. **Mở form chỉnh sửa**
   - Click nút **🖊️ (Chỉnh sửa)** màu vàng
   - Modal "Chỉnh sửa dự thảo" sẽ hiển thị

3. **Thực hiện chỉnh sửa**
   - **Tiêu đề**: Cập nhật tiêu đề dự thảo
   - **Nội dung**: Sửa đổi nội dung chi tiết
   - **Trạng thái**: Thay đổi trạng thái (Dự thảo/Đang xem xét/Đã duyệt/Từ chối)
   - **File đính kèm**: Upload file mới (sẽ thay thế file cũ)

4. **Lưu thay đổi**
   - Click nút **"💾 Lưu thay đổi"**
   - Hệ thống sẽ hiển thị thông báo thành công
   - Danh sách dự thảo tự động cập nhật

### Xóa Dự thảo

1. **Tìm dự thảo cần xóa**
   - Từ danh sách dự thảo, tìm dự thảo cần xóa

2. **Thực hiện xóa**
   - Click nút **🗑️ (Xóa)** màu đỏ
   - Hộp thoại xác nhận sẽ hiển thị

3. **Xác nhận xóa**
   - Đọc kỹ thông báo xác nhận
   - Click **"OK"** để xác nhận xóa
   - Click **"Hủy"** để hủy thao tác

4. **Kết quả**
   - Dự thảo bị xóa khỏi hệ thống
   - Tất cả góp ý liên quan cũng bị xóa
   - Danh sách dự thảo tự động cập nhật

### Xem Chi tiết Dự thảo

1. **Mở chi tiết**
   - Click nút **👁️ (Xem chi tiết)** màu xanh
   - Modal chi tiết sẽ hiển thị

2. **Thông tin hiển thị**
   - **Thông tin cơ bản**: Tiêu đề, trạng thái, người tạo, ngày tạo
   - **Nội dung đầy đủ**: Toàn bộ nội dung dự thảo
   - **File đính kèm**: Danh sách file có thể download
   - **Góp ý**: Tất cả góp ý từ người dùng

3. **Hành động từ modal chi tiết**
   - Click **"🖊️ Chỉnh sửa"** để chuyển sang modal chỉnh sửa
   - Click **"Đóng"** để đóng modal

## 🔐 Quyền hạn và Bảo mật

### Quyền Chỉnh sửa
- ✅ **Người tạo dự thảo**: Có thể chỉnh sửa dự thảo do mình tạo
- ✅ **Admin**: Có thể chỉnh sửa tất cả dự thảo
- ✅ **Manager**: Có thể chỉnh sửa tất cả dự thảo
- ❌ **User khác**: Không thể chỉnh sửa dự thảo của người khác

### Quyền Xóa
- ✅ **Người tạo dự thảo**: Có thể xóa dự thảo do mình tạo
- ✅ **Admin**: Có thể xóa tất cả dự thảo
- ✅ **Manager**: Có thể xóa tất cả dự thảo  
- ❌ **User khác**: Không thể xóa dự thảo của người khác

### Bảo mật
- **Xác thực**: Phải đăng nhập để thực hiện các thao tác
- **Phân quyền**: Kiểm tra quyền hạn trước khi cho phép chỉnh sửa/xóa
- **Xác nhận**: Có dialog xác nhận trước khi xóa
- **Log**: Ghi lại các thao tác để audit

## 📱 Giao diện Responsive

### Desktop
- Hiển thị đầy đủ các nút chức năng
- Modal rộng với layout 2 cột
- Bảng hiển thị đầy đủ thông tin

### Tablet  
- Nút chức năng hiển thị đầy đủ nhưng nhỏ hơn
- Modal thu nhỏ phù hợp màn hình
- Một số cột ẩn để tiết kiệm không gian

### Mobile
- Nút chức năng xếp theo chiều dọc
- Modal full-screen
- Chỉ hiển thị thông tin cơ bản trong bảng

## 🔧 Tính năng Nâng cao (Phần Admin)

### Bộ lọc và Tìm kiếm
1. **Tìm kiếm theo tiêu đề**
   - Nhập từ khóa vào ô "Tìm kiếm"
   - Kết quả hiển thị ngay lập tức

2. **Lọc theo trạng thái**
   - Chọn trạng thái từ dropdown
   - Hiển thị chỉ dự thảo có trạng thái đã chọn

3. **Lọc theo người tạo**
   - Chọn người tạo từ dropdown
   - Hiển thị chỉ dự thảo của người đó

4. **Xóa bộ lọc**
   - Click nút "🧹 Xóa lọc"
   - Hiển thị lại toàn bộ dự thảo

### Thống kê
- Hiển thị tổng số dự thảo
- Đếm số lượng theo trạng thái
- Hiển thị số góp ý cho mỗi dự thảo

## ⚠️ Lưu ý quan trọng

### Trước khi Chỉnh sửa
- ✅ Backup dữ liệu quan trọng
- ✅ Kiểm tra quyền hạn của bạn
- ✅ Đảm bảo nội dung chỉnh sửa chính xác

### Trước khi Xóa
- ⚠️ **Cảnh báo**: Thao tác xóa KHÔNG THỂ HOÀN TÁC
- ⚠️ Tất cả góp ý liên quan sẽ bị mất
- ⚠️ File đính kèm sẽ không thể khôi phục
- ✅ Đảm bảo dự thảo thực sự không cần thiết

### Khi gặp Lỗi
- 🔄 Thử tải lại trang (F5)
- 📞 Liên hệ Admin nếu vấn đề còn tồn tại
- 📝 Ghi lại thông báo lỗi để báo cáo

## 🆘 Troubleshooting

### Lỗi thường gặp

#### "Bạn không có quyền chỉnh sửa dự thảo này"
- **Nguyên nhân**: Bạn không phải là người tạo hoặc Admin/Manager
- **Giải pháp**: Liên hệ người tạo dự thảo hoặc Admin

#### "Dự thảo không tồn tại"  
- **Nguyên nhân**: Dự thảo đã bị xóa hoặc ID không đúng
- **Giải pháp**: Tải lại trang và kiểm tra lại

#### "Lỗi kết nối mạng"
- **Nguyên nhân**: Mất kết nối internet hoặc server
- **Giải pháp**: Kiểm tra kết nối và thử lại

#### Modal không hiển thị
- **Nguyên nhân**: Lỗi JavaScript hoặc CSS
- **Giải pháp**: Tải lại trang (Ctrl+F5)

### Liên hệ hỗ trợ
- **Email**: support@evnchp.vn
- **Phone**: 1900-xxxx
- **Admin**: Liên hệ IT Department

---

## 📚 Tài liệu liên quan

- [📖 Hướng dẫn Tạo Dự thảo](./DRAFT_CREATION_GUIDE.md)
- [📖 Hướng dẫn Góp ý Dự thảo](./DRAFT_COMMENT_GUIDE.md)  
- [📖 Hướng dẫn Quản trị Hệ thống](./ADMIN_GUIDE.md)
- [📖 API Reference](./API_REFERENCE.md)

---

**Cập nhật lần cuối**: `date +'%d/%m/%Y'`  
**Phiên bản**: 6.1.0  
**Trạng thái**: ✅ Hoàn thành và Đã test
