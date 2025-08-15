# 🗳️ HỆ THỐNG BIỂU QUYẾT ĐIỆN TỬ - EVNCHP

## 📋 Mô tả dự án
Hệ thống biểu quyết điện tử hiện đại cho EVNCHP với giao diện thân thiện và bảo mật cao.

### ✨ Tính năng chính:
- 🏠 **Trang chủ** - Dashboard thống kê tổng quan
- 📄 **Dự thảo tờ trình** - Quản lý các dự thảo văn bản
- 🗳️ **Biểu quyết** - Hệ thống voting điện tử
- 📊 **Phiếu tổng hợp** - Báo cáo kết quả biểu quyết
- 📋 **Quản lý nghị quyết** - Quản lý các nghị quyết đã thông qua
- 📁 **Tủ tài liệu** - Lưu trữ tài liệu
- ✍️ **Ký số văn bản** - Chữ ký số điện tử
- 👥 **Quản trị người dùng** - Quản lý users và phân quyền
- 🗑️ **Thùng rác** - Khôi phục dữ liệu đã xóa

## 🛠️ Công nghệ sử dụng

### Backend:
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQL Server** - Database management system
- **bcrypt** - Password hashing
- **express-session** - Session management

### Frontend:
- **Vanilla JavaScript** - No framework dependencies
- **Bootstrap 5** - UI framework
- **Chart.js** - Data visualization
- **Font Awesome** - Icons

### Architecture:
- **SPA** (Single Page Application)
- **RESTful API** design
- **MVC** pattern
- **Role-based** access control

## 📦 Yêu cầu hệ thống

- **Node.js** >= 14.x
- **SQL Server** 2019+ 
- **npm** hoặc **yarn**
- **Windows** 10+ (recommended)

## ⚡ Cài đặt nhanh

### 1. Clone repository:
```bash
git clone https://github.com/cuongchp/HTBIEUQUYET_V6.git
cd HTBIEUQUYET_V6
```

### 2. Cài đặt dependencies:
```bash
npm install
```

### 3. Tạo file .env:
```env
NODE_ENV=development
PORT=3000
DB_SERVER=localhost
DB_NAME=HTBIEUQUYET_V6
DB_USER=sa
DB_PASSWORD=your_password_here
SESSION_SECRET=your-random-secret-key-here
```

### 4. Chạy ứng dụng:
```bash
npm start
```

### 5. Truy cập:
```
URL: http://localhost:3000
Username: admin
Password: admin123
```

## 📁 Cấu trúc dự án

```
HTBIEUQUYET_V6/
├── 📂 config/              # Cấu hình database, auth
├── 📂 routes/              # API routes
│   ├── admin.js           # Admin routes
│   ├── auth.js            # Authentication 
│   ├── voting.js          # Voting system
│   └── recycle-bin.js     # Recycle bin
├── 📂 public/              # Frontend files
│   ├── 📂 css/            # Stylesheets
│   ├── 📂 js/             # JavaScript files
│   └── index.html         # Main SPA file
├── 📂 uploads/             # File uploads
├── 📂 documents/           # Document storage
├── 📄 server.js            # Main server file
└── 📄 package.json         # Dependencies
```

## 🔐 Bảo mật

- ✅ **Password hashing** với bcrypt
- ✅ **Session-based** authentication
- ✅ **CORS** protection
- ✅ **SQL injection** prevention
- ✅ **Role-based** access control
- ✅ **Input validation** & sanitization

## 🚀 Tính năng nổi bật

### 📊 Dashboard thống kê:
- Thống kê real-time số lượng người dùng
- Biểu đồ kết quả biểu quyết
- Thông tin hoạt động gần đây

### 🗳️ Hệ thống biểu quyết:
- Tạo phiếu biểu quyết linh hoạt
- Voting real-time
- Kết quả tức thời
- Export báo cáo

### 👥 Quản lý người dùng:
- Phân quyền chi tiết theo module
- Quản lý vai trò người dùng
- Lịch sử hoạt động

### 🗑️ Thùng rác thông minh:
- Soft delete cho tất cả dữ liệu
- Khôi phục dễ dàng
- Xóa vĩnh viễn có xác nhận

## 🤝 Đóng góp

1. **Fork** repository
2. Tạo **feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit** changes: `git commit -m 'Add some AmazingFeature'`
4. **Push** to branch: `git push origin feature/AmazingFeature`
5. Mở **Pull Request**

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra [Issues](https://github.com/cuongchp/HTBIEUQUYET_V6/issues)
2. Tạo issue mới với mô tả chi tiết
3. Hoặc liên hệ team phát triển

## 📄 License

Dự án này được phát hành dưới [MIT License](LICENSE).

## 🏢 Về EVNCHP

Dự án được phát triển cho **Tổng công ty Điện lực miền Trung** nhằm hiện đại hóa quy trình biểu quyết và ra quyết định.

---

⭐ **Nếu dự án hữu ích, hãy cho chúng tôi một star!** ⭐
