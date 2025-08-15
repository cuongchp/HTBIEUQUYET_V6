# 🔒 HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG - BẢN BẢO MẬT

## 📋 TỔNG QUAN CẢI TIẾN

Hệ thống đã được nâng cấp với các tính năng bảo mật nâng cao:

### ✅ Đã khắc phục:
- **SQL Injection** - Sử dụng parameterized queries
- **Hardcoded credentials** - Chuyển sang environment variables
- **Weak password hashing** - Tăng bcrypt rounds
- **Session security** - HTTPOnly, Secure, SameSite
- **File upload security** - Type validation, size limits
- **Rate limiting** - Chống brute force attacks
- **Input validation** - express-validator
- **Security headers** - Helmet.js
- **Comprehensive logging** - Winston logger
- **Error handling** - Structured error responses

## 🚀 HƯỚNG DẪN CÀI ĐẶT

### Bước 1: Cập nhật Database
```cmd
# Chạy script cập nhật database
sqlcmd -S DUONGVIETCUONG\SQLEXPRESS -i database\security_upgrade.sql
```

### Bước 2: Cài đặt Dependencies
```cmd
npm install
```

### Bước 3: Cấu hình Environment
Kiểm tra file `.env` đã được tạo với các cấu hình bảo mật:
```properties
NODE_ENV=development
PORT=3000
DB_SERVER=DUONGVIETCUONG\SQLEXPRESS
DB_NAME=BIEUQUYET_CHP
JWT_SECRET=evnchp_jwt_secret_key_2025_voting_system_secure_random_string
SESSION_SECRET=evnchp_session_secret_key_2025_voting_system_ultra_secure_random
BCRYPT_ROUNDS=12
MAX_FILE_SIZE=52428800
```

### Bước 4: Khởi động Server Bảo mật
```cmd
# Sử dụng script bảo mật mới
start_secure.bat

# Hoặc chạy trực tiếp
node server_secure.js
```

## 🔧 CẤU TRÚC FILE MỚI

```
HTBIEUQUYET_V6/
├── 📁 services/                # Business logic services
│   ├── databaseService.js      # Database operations với parameterized queries
│   ├── fileUploadService.js    # Secure file upload handling
│   └── loggingService.js       # Comprehensive logging
├── 📁 middleware/              # Security middleware
│   ├── auth.js                 # Authentication & authorization
│   └── validation.js           # Input validation & sanitization
├── 📁 database/               # Database scripts
│   └── security_upgrade.sql   # Security upgrade script
├── 📁 logs/                   # Log files (tự động tạo)
│   ├── combined.log
│   ├── error.log
│   └── security.log
├── .env                       # Environment configuration
├── server_secure.js           # Main secure server
└── start_secure.bat          # Secure startup script
```

## 🛡️ TÍNH NĂNG BẢO MẬT MỚI

### 1. Authentication & Authorization
- **Rate Limiting**: 5 login attempts/15 phút
- **Session Security**: HTTPOnly, Secure cookies
- **Role-based Access**: Admin/User permissions
- **Permission Validation**: Module-based access control

### 2. Input Validation
```javascript
// Example: Login validation
POST /api/login
{
  "username": "admin",     // 3-50 chars, alphanumeric + _
  "password": "admin123"   // 6+ chars với complexity
}
```

### 3. File Upload Security
- **Type Validation**: Chỉ .pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png
- **Size Limit**: 50MB per file
- **MIME Type Check**: Double validation
- **Secure Filenames**: Timestamp + random + sanitized name

### 4. Logging & Monitoring
```javascript
// Log locations
logs/combined.log    // All logs
logs/error.log       // Error logs only  
logs/security.log    // Security events
```

### 5. Database Security
- **Soft Delete**: IsDeleted column cho tất cả bảng
- **Indexes**: Performance optimization
- **Constraints**: Data integrity checks
- **Audit Trail**: AuditLog table

## 📊 API ENDPOINTS MỚI

### Security Endpoints
```
GET  /api/ping      # Enhanced system info
GET  /api/health    # Health check với database
POST /api/login     # Enhanced với validation
POST /api/logout    # Secure logout
```

### Enhanced Error Responses
```json
{
  "error": "Tên đăng nhập hoặc mật khẩu không đúng",
  "code": "LOGIN_FAILED",
  "timestamp": "2025-07-27T10:30:00.000Z"
}
```

## 🧪 TESTING

### Test Basic Functions
```cmd
# 1. Khởi động server
start_secure.bat

# 2. Test ping
curl http://localhost:3000/api/ping

# 3. Test health
curl http://localhost:3000/api/health

# 4. Test login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Test Security Features
```cmd
# Test rate limiting (chạy 6 lần nhanh)
for /l %i in (1,1,6) do curl -X POST http://localhost:3000/api/login -d '{"username":"test","password":"wrong"}'

# Test file upload validation
curl -X POST http://localhost:3000/api/votes \
  -F "files=@invalid_file.exe"
```

## 🔍 MONITORING

### Log Files
```cmd
# Theo dõi logs realtime
tail -f logs/combined.log    # Linux/Mac
Get-Content logs/combined.log -Wait    # PowerShell
```

### Security Events
Tất cả security events được log với format:
```json
{
  "timestamp": "2025-07-27T10:30:00.000Z",
  "event": "LOGIN_ATTEMPT", 
  "username": "admin",
  "success": true,
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0..."
}
```

## ⚠️ PRODUCTION CHECKLIST

### Trước khi deploy Production:

1. **Environment Variables**
```properties
NODE_ENV=production
JWT_SECRET=<generate-strong-secret>
SESSION_SECRET=<generate-strong-secret>
DB_PASSWORD=<strong-database-password>
```

2. **Database Security**
- Tạo database user riêng cho app (không dùng 'sa')
- Cấp quyền tối thiểu cần thiết
- Enable SSL cho database connection

3. **Server Configuration**
- Enable HTTPS/SSL certificates
- Configure reverse proxy (nginx/IIS)
- Set up monitoring & alerting
- Database backup strategy

4. **Security Headers**
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)  
- Certificate pinning

## 🆘 TROUBLESHOOTING

### Lỗi thường gặp:

1. **Database Connection Failed**
```
Kiểm tra SQL Server service
Verify connection string trong .env
Check firewall settings
```

2. **Module Not Found**
```cmd
npm install  # Cài đặt lại dependencies
```

3. **Permission Denied**
```
Kiểm tra user permissions trong database
Verify session data
Check role assignments
```

4. **File Upload Failed**
```
Kiểm tra file type allowed
Verify file size < 50MB
Check upload directory permissions
```

## 📞 HỖ TRỢ

- **Logs**: Kiểm tra `logs/error.log` cho chi tiết lỗi
- **Health Check**: `GET /api/health` để kiểm tra system status
- **Debug Mode**: Set `LOG_LEVEL=debug` trong .env

---

## 🎉 KẾT LUẬN

Hệ thống đã được nâng cấp toàn diện về bảo mật và hiệu suất. Tất cả các lỗ hổng bảo mật chính đã được khắc phục, code được tổ chức lại theo best practices, và có monitoring/logging đầy đủ.

**Next Steps:**
1. Test toàn bộ functionality với server mới
2. Setup production environment với checklist trên
3. Train users về các tính năng mới
4. Monitor và optimize performance
