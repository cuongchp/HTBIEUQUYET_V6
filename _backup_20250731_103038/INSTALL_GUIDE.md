# HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG BIỂU QUYẾT EVNCHP

## 1. YÊU CẦU HỆ THỐNG

### Phần cứng tối thiểu

- CPU: Intel Core i3 hoặc tương đương
- RAM: 4GB
- Ổ cứng: 10GB trống
- Kết nối mạng ổn định

### Phần mềm yêu cầu:
- Windows 10/11 hoặc Windows Server 2019+
- Node.js 16.x hoặc cao hơn
- SQL Server 2019 hoặc SQL Server Express
- Trình duyệt web hiện đại (Chrome, Edge, Firefox)

## 2. CÀI ĐẶT SQL SERVER

### Bước 1: Tải và cài đặt SQL Server
1. Tải SQL Server Express từ: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Chạy file cài đặt và chọn "Custom" installation
3. Trong quá trình cài đặt:
   - Chọn "Mixed Mode" authentication
   - Đặt mật khẩu cho tài khoản 'sa': **123456**
   - Ghi nhớ instance name: **SQLEXPRESS**

### Bước 2: Cấu hình SQL Server
1. Mở SQL Server Configuration Manager
2. Vào "SQL Server Network Configuration" > "Protocols for SQLEXPRESS"
3. Enable "TCP/IP"
4. Right-click "TCP/IP" > Properties > IP Addresses tab
5. Đặt port 1433 cho tất cả IP addresses
6. Restart SQL Server service

### Bước 3: Tạo Database
1. Mở SQL Server Management Studio (SSMS)
2. Connect với:
   - Server name: `DUONGVIETCUONG\SQLEXPRESS`
   - Authentication: SQL Server Authentication
   - Login: sa
   - Password: 123456
3. Chạy script `database/create_database.sql`
4. Chạy script `database/sample_data.sql` để thêm dữ liệu mẫu

## 3. CÀI ĐẶT NODE.JS

### Bước 1: Tải và cài đặt Node.js
1. Tải từ: https://nodejs.org (phiên bản LTS)
2. Chạy installer và làm theo hướng dẫn
3. Kiểm tra cài đặt:
   ```cmd
   node --version
   npm --version
   ```

## 4. CÀI ĐẶT ỨNG DỤNG

### Bước 1: Giải nén source code
1. Giải nén file zip vào thư mục `C:\EVNCHP_VotingSystem`
2. Mở Command Prompt với quyền Administrator
3. Chuyển đến thư mục ứng dụng:
   ```cmd
   cd C:\EVNCHP_VotingSystem
   ```

### Bước 2: Cài đặt dependencies
```cmd
npm install
```

### Bước 3: Cấu hình database connection
1. Mở file `.env`
2. Kiểm tra thông tin kết nối:
   ```
   DB_SERVER=DUONGVIETCUONG\SQLEXPRESS
   DB_DATABASE=BIEUQUYET_CHP
   DB_USER=sa
   DB_PASSWORD=123456
   ```

### Bước 4: Chạy ứng dụng
```cmd
npm start
```
Hoặc double-click file `start.bat`

## 5. TRUY CẬP HỆ THỐNG

### URL: http://localhost:3000

### Tài khoản đăng nhập:
- **Admin:** admin / admin123
- **Thư ký:** thuky / thuky123  
- **Chủ tịch:** chutich / chutich123
- **Thành viên HĐQT:** thanhvien1 / tv123

## 6. XỬ LÝ SỰ CỐ

### Lỗi kết nối Database:
1. Kiểm tra SQL Server đang chạy
2. Kiểm tra firewall cho port 1433
3. Kiểm tra thông tin kết nối trong `.env`

### Lỗi port đã được sử dụng:
1. Thay đổi PORT trong `.env` (ví dụ: 3001, 3002)
2. Restart ứng dụng

### Lỗi quyền truy cập:
1. Chạy Command Prompt với quyền Administrator
2. Kiểm tra antivirus có block ứng dụng không

## 7. CẤU HÌNH PRODUCTION

### Bước 1: Cài đặt PM2 (Process Manager)
```cmd
npm install -g pm2
```

### Bước 2: Chạy với PM2
```cmd
pm2 start server.js --name "evnchp-voting"
pm2 startup
pm2 save
```

### Bước 3: Cấu hình SSL (tuỳ chọn)
1. Mua SSL certificate
2. Cấu hình HTTPS trong server.js
3. Cập nhật port thành 443

## 8. BACKUP & RESTORE

### Backup Database:
```sql
BACKUP DATABASE BIEUQUYET_CHP 
TO DISK = 'C:\Backup\BIEUQUYET_CHP.bak'
```

### Backup Files:
- Sao chép toàn bộ thư mục `uploads/`
- Sao chép file `.env`

### Restore Database:
```sql
RESTORE DATABASE BIEUQUYET_CHP 
FROM DISK = 'C:\Backup\BIEUQUYET_CHP.bak'
```

## 9. BẢO TRÌ HỆ THỐNG

### Logs:
- Application logs: Console output
- Database logs: SQL Server logs
- File uploads: `uploads/` folder

### Cập nhật:
1. Backup toàn bộ hệ thống
2. Thay thế source code mới
3. Chạy `npm install` để cập nhật dependencies
4. Restart ứng dụng

## 10. HỖ TRỢ KỸ THUẬT

### Liên hệ:
- Email: support@evnchp.vn
- Phone: (024) 3xxx-xxxx
- Hotline: 1900-xxxx

### Thông tin hệ thống:
- Version: 1.0.0
- Release Date: July 2025
- Technology: Node.js + SQL Server + Bootstrap 5

---
**Lưu ý:** Hướng dẫn này dành cho việc cài đặt trên môi trường Windows. Để cài đặt trên Linux/MacOS, vui lòng tham khảo tài liệu riêng.
