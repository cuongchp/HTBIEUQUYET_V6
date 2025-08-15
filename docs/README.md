# HỆ THỐNG BIỂU QUYẾT ĐIỆN TỬ EVNCHP V6 
 
## Giới thiệu 
Hệ thống biểu quyết điện tử cho Tổng Công ty Điện lực Miền Trung (EVNCHP), phiên bản 6.0. 
 
## Cấu trúc dự án 
- `/public` - Frontend (HTML, CSS, JavaScript) 
- `/routes` - API routes (Express.js) 
- `/controllers` - Xử lý logic nghiệp vụ 
- `/models` - Tương tác với database 
- `/services` - Business logic services 
- `/middleware` - Express middleware 
- `/database` - SQL scripts 
- `/uploads` - File uploads directory 
- `/docs` - Documentation 
 
## Cài đặt và chạy 
 
### Yêu cầu hệ thống 
- Node.js 
- SQL Server 2019+ 
- Windows Server 2016+ hoặc Windows 10+ 
 
### Cài đặt 
1. Clone repository 
2. Cài đặt dependencies: `npm install` 
3. Cấu hình database trong file `.env` 
4. Chạy script tạo database: `database/create_database.sql` 
5. Khởi động server: `npm start` hoặc `start.bat` 
 
### Tài khoản mặc định 
- Admin: `admin / admin123` 
- User: `user1 / user123` 
