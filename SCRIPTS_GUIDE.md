# 🚀 Hướng Dẫn Sử Dụng Scripts - Hệ Thống Biểu Quyết EVNCHP

## 📋 Tổng Quan

Bộ scripts này được thiết kế để tự động hóa việc quản lý và vận hành Hệ Thống Biểu Quyết trực tuyến. Gồm 8 scripts chính với các chức năng khác nhau.

## 📁 Danh Sách Scripts

### 1. 🎯 `menu.bat` - Menu Chính
**Script tổng hợp với giao diện menu thân thiện**

```cmd
menu.bat
```

**Chức năng:**
- Giao diện menu đẹp mắt với ASCII art
- Truy cập nhanh tất cả chức năng khác
- Quản lý dự án một cách trực quan

### 2. 🚀 `start-project.bat` - Khởi Chạy Production
**Khởi chạy server trong môi trường production**

```cmd
start-project.bat
```

**Chức năng:**
- Kiểm tra dependencies (Node.js, npm)
- Xác thực file .env
- Cài đặt packages tự động
- Khởi chạy server
- Logging chi tiết

### 3. 🔧 `start-dev.bat` - Development Mode
**Khởi chạy server với auto-reload cho development**

```cmd
start-dev.bat
```

**Chức năng:**
- Cài đặt nodemon tự động
- Auto-reload khi có thay đổi code
- Debug mode enabled
- Live development environment

### 4. 🗄️ `setup-database.bat` - Thiết Lập Database
**Khởi tạo và cấu hình database**

```cmd
setup-database.bat
```

**Chức năng:**
- Tạo database và tables
- Import dữ liệu mẫu
- Thiết lập permissions
- Validation kết nối

### 5. 🔍 `check-system.bat` - Kiểm Tra Hệ Thống
**Kiểm tra toàn diện hệ thống**

```cmd
check-system.bat
```

**Chức năng:**
- Kiểm tra Node.js và npm versions
- Validation dependencies
- Test database connection
- Kiểm tra file system permissions
- Port availability check

### 6. 💾 `backup-restore.bat` - Backup & Restore
**Quản lý backup và restore database**

```cmd
backup-restore.bat
```

**Chức năng:**
- Backup database với timestamp
- Restore từ backup files
- Quản lý backup files
- Automatic cleanup backup cũ

### 7. 📊 `monitor.bat` - Giám Sát Hệ Thống
**Monitor realtime và thống kê hệ thống**

```cmd
monitor.bat
```

**Chức năng:**
- Monitor realtime CPU, Memory
- Kiểm tra ports và services
- Network connectivity tests
- Performance testing
- System logs viewer

## ⚙️ Yêu Cầu Hệ Thống

### Phần Mềm Bắt Buộc:
- **Windows 10/11** (hoặc Windows Server 2016+)
- **Node.js 14.0+** ([Download](https://nodejs.org/))
- **SQL Server 2017+** (Express/Standard/Enterprise)
- **npm** (đi kèm với Node.js)

### Phần Mềm Tùy Chọn:
- **Git** (để quản lý source code)
- **Visual Studio Code** (IDE được khuyến nghị)
- **SQL Server Management Studio** (quản lý database)

## 🔧 Thiết Lập Ban Đầu

### 1. Chuẩn Bị Môi Trường

```cmd
# Kiểm tra Node.js
node --version

# Kiểm tra npm
npm --version

# Kiểm tra SQL Server
sqlcmd -S localhost -E -Q "SELECT @@VERSION"
```

### 2. Cấu Hình Database

Tạo file `.env` trong thư mục gốc:

```env
# Database Configuration
DB_SERVER=localhost
DB_NAME=HTBIEUQUYET
DB_USER=sa
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

### 3. Cấp Quyền Scripts

```cmd
# Chạy Command Prompt as Administrator
# Navigate to project folder
cd "d:\10. LAP TRINH\9. PHAN MEM BIEU QUYET\HTBIEUQUYET_V6"

# Set execution policy (if needed)
powershell Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🚀 Quy Trình Khởi Động

### Lần Đầu Thiết Lập:

```cmd
1. check-system.bat     # Kiểm tra hệ thống
2. setup-database.bat   # Thiết lập database
3. start-project.bat    # Khởi chạy lần đầu
```

### Sử Dụng Hàng Ngày:

```cmd
# Development
start-dev.bat

# Production
start-project.bat

# Hoặc sử dụng menu
menu.bat
```

## 📊 Monitoring & Maintenance

### Kiểm Tra Định Kỳ:
```cmd
# Hàng ngày
monitor.bat -> [1] Monitor realtime

# Hàng tuần
backup-restore.bat -> [1] Backup Database
check-system.bat

# Hàng tháng
backup-restore.bat -> [4] Xóa backup cũ
```

### Troubleshooting:
```cmd
# Kiểm tra lỗi hệ thống
check-system.bat

# Xem logs
monitor.bat -> [7] Xem event logs

# Reset database (nếu cần)
setup-database.bat -> [4] Reset permissions
```

## 🔧 Cấu Hình Nâng Cao

### Custom Port Configuration:
Sửa file `.env`:
```env
PORT=8080  # Thay đổi port mặc định
```

### Database Connection String:
```env
# SQL Server Authentication
DB_SERVER=192.168.1.100
DB_NAME=HTBIEUQUYET_PROD
DB_USER=app_user
DB_PASSWORD=secure_password

# Windows Authentication
DB_SERVER=localhost
DB_NAME=HTBIEUQUYET
DB_TRUSTED=true
```

### Performance Tuning:
```env
# Node.js Memory Limit
NODE_OPTIONS=--max_old_space_size=4096

# Connection Pool
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_TIMEOUT=30000
```

## 🆘 Xử Lý Sự Cố Phổ Biến

### 1. Port 3000 đã được sử dụng:
```cmd
# Tìm process đang sử dụng port
netstat -ano | findstr :3000

# Kill process
taskkill /PID <process_id> /F

# Hoặc đổi port trong .env
```

### 2. Database connection failed:
```cmd
# Kiểm tra SQL Server service
sc query MSSQLSERVER

# Start service nếu cần
net start MSSQLSERVER

# Test connection
sqlcmd -S localhost -E -Q "SELECT 1"
```

### 3. Node.js modules missing:
```cmd
# Cài đặt lại dependencies
npm cache clean --force
npm install

# Hoặc sử dụng
start-project.bat  # Sẽ tự động cài đặt
```

### 4. Permission denied:
```cmd
# Chạy Command Prompt as Administrator
# Hoặc cấp quyền cho user hiện tại
icacls . /grant %USERNAME%:F /T
```

## 📝 Logs và Debug

### Vị Trí Logs:
- **Application logs**: `logs/app.log`
- **Error logs**: `logs/error.log`
- **Database logs**: `logs/database.log`
- **System logs**: Windows Event Viewer

### Debug Mode:
```cmd
# Bật debug trong Development
set DEBUG=app:*
start-dev.bat

# Hoặc trong .env
DEBUG=app:*,database:*
```

## 🔄 Backup Strategy

### Automatic Backup:
```cmd
# Thiết lập Windows Task Scheduler
schtasks /create /tn "HTBIEUQUYET_Backup" /tr "d:\path\to\backup-restore.bat" /sc daily /st 02:00
```

### Manual Backup:
```cmd
backup-restore.bat -> [1] Backup Database
```

### Backup Retention:
- **Daily backups**: Giữ 7 ngày
- **Weekly backups**: Giữ 4 tuần  
- **Monthly backups**: Giữ 12 tháng

## 📞 Hỗ Trợ

### Contact Information:
- **Developer**: EVNCHP IT Team
- **Email**: support@evnchp.vn
- **Phone**: (028) xxxx-xxxx

### Tài Liệu Tham Khảo:
- [Node.js Documentation](https://nodejs.org/docs/)
- [SQL Server Documentation](https://docs.microsoft.com/sql/)
- [Express.js Guide](https://expressjs.com/)

---

## 📌 Lưu Ý Quan Trọng

⚠️ **Bảo Mật:**
- Không commit file `.env` vào Git
- Sử dụng strong passwords
- Định kỳ update dependencies

⚠️ **Performance:**
- Monitor memory usage thường xuyên
- Cleanup logs định kỳ
- Optimize database queries

⚠️ **Backup:**
- Test restore process thường xuyên
- Lưu backup ở nhiều vị trí khác nhau
- Document recovery procedures

---

**© 2024 EVNCHP - Hệ Thống Biểu Quyết Trực Tuyến**
