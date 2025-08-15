@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║        TẠO DOCUMENTATION                ║
echo ╚══════════════════════════════════════════╝
echo.

:: Tạo thư mục docs nếu chưa có
mkdir "docs" 2>nul

:: Tạo file README.md
echo [1/4] Tạo file README.md chính...
echo # HỆ THỐNG BIỂU QUYẾT ĐIỆN TỬ EVNCHP V6 > docs\README.md
echo. >> docs\README.md
echo ## Giới thiệu >> docs\README.md
echo Hệ thống biểu quyết điện tử cho Tổng Công ty Điện lực Miền Trung (EVNCHP), phiên bản 6.0. >> docs\README.md
echo. >> docs\README.md
echo ## Cấu trúc dự án >> docs\README.md
echo - `/public` - Frontend (HTML, CSS, JavaScript) >> docs\README.md
echo - `/routes` - API routes (Express.js) >> docs\README.md
echo - `/controllers` - Xử lý logic nghiệp vụ >> docs\README.md
echo - `/models` - Tương tác với database >> docs\README.md
echo - `/services` - Business logic services >> docs\README.md
echo - `/middleware` - Express middleware >> docs\README.md
echo - `/database` - SQL scripts >> docs\README.md
echo - `/uploads` - File uploads directory >> docs\README.md
echo - `/docs` - Documentation >> docs\README.md
echo. >> docs\README.md
echo ## Cài đặt và chạy >> docs\README.md
echo. >> docs\README.md
echo ### Yêu cầu hệ thống >> docs\README.md
echo - Node.js >= 14.x >> docs\README.md
echo - SQL Server 2019+ >> docs\README.md
echo - Windows Server 2016+ hoặc Windows 10+ >> docs\README.md
echo. >> docs\README.md
echo ### Cài đặt >> docs\README.md
echo 1. Clone repository >> docs\README.md
echo 2. Cài đặt dependencies: `npm install` >> docs\README.md
echo 3. Cấu hình database trong file `.env` >> docs\README.md
echo 4. Chạy script tạo database: `database/create_database.sql` >> docs\README.md
echo 5. Khởi động server: `npm start` hoặc `start.bat` >> docs\README.md
echo. >> docs\README.md
echo ### Tài khoản mặc định >> docs\README.md
echo - Admin: `admin / admin123` >> docs\README.md
echo - User: `user1 / user123` >> docs\README.md

:: Tạo file ARCHITECTURE.md
echo [2/4] Tạo file ARCHITECTURE.md...
echo # Kiến trúc Hệ thống HTBIEUQUYET V6 > docs\ARCHITECTURE.md
echo. >> docs\ARCHITECTURE.md
echo ## Tổng quan >> docs\ARCHITECTURE.md
echo Hệ thống được xây dựng theo mô hình MVC với: >> docs\ARCHITECTURE.md
echo - **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS + Bootstrap 5) >> docs\ARCHITECTURE.md
echo - **Backend**: Node.js + Express.js >> docs\ARCHITECTURE.md
echo - **Database**: SQL Server >> docs\ARCHITECTURE.md
echo - **Authentication**: JWT >> docs\ARCHITECTURE.md
echo. >> docs\ARCHITECTURE.md
echo ## Cấu trúc thư mục >> docs\ARCHITECTURE.md
echo. >> docs\ARCHITECTURE.md
echo ```plaintext >> docs\ARCHITECTURE.md
echo HTBIEUQUYET_V6/ >> docs\ARCHITECTURE.md
echo ├── controllers/           # Xử lý logic nghiệp vụ >> docs\ARCHITECTURE.md
echo │   ├── draftsController.js  # Quản lý dự thảo >> docs\ARCHITECTURE.md
echo │   ├── votesController.js   # Quản lý biểu quyết >> docs\ARCHITECTURE.md
echo │   └── usersController.js   # Quản lý người dùng >> docs\ARCHITECTURE.md
echo ├── models/                # Tương tác database >> docs\ARCHITECTURE.md
echo │   ├── draftModel.js      # Model dự thảo >> docs\ARCHITECTURE.md
echo │   ├── voteModel.js       # Model biểu quyết >> docs\ARCHITECTURE.md
echo │   └── userModel.js       # Model người dùng >> docs\ARCHITECTURE.md
echo ├── routes/                # Định tuyến API >> docs\ARCHITECTURE.md
echo ├── middleware/            # Middleware >> docs\ARCHITECTURE.md
echo ├── public/                # Frontend >> docs\ARCHITECTURE.md
echo │   ├── css/ >> docs\ARCHITECTURE.md
echo │   ├── js/               # JavaScript >> docs\ARCHITECTURE.md
echo │   │   ├── modules/      # JS modules >> docs\ARCHITECTURE.md
echo │   └── index.html >> docs\ARCHITECTURE.md
echo ├── config/                # Cấu hình >> docs\ARCHITECTURE.md
echo ├── database/              # SQL scripts >> docs\ARCHITECTURE.md
echo ├── uploads/               # File uploads >> docs\ARCHITECTURE.md
echo ├── docs/                  # Documentation >> docs\ARCHITECTURE.md
echo ├── server.js              # Entry point >> docs\ARCHITECTURE.md
echo └── package.json           # NPM config >> docs\ARCHITECTURE.md
echo ``` >> docs\ARCHITECTURE.md

:: Tạo file API_REFERENCE.md
echo [3/4] Tạo file API_REFERENCE.md...
echo # API Reference > docs\API_REFERENCE.md
echo. >> docs\API_REFERENCE.md
echo ## Authentication >> docs\API_REFERENCE.md
echo. >> docs\API_REFERENCE.md
echo ### Login >> docs\API_REFERENCE.md
echo. >> docs\API_REFERENCE.md
echo `POST /api/login` >> docs\API_REFERENCE.md
echo. >> docs\API_REFERENCE.md
echo **Request Body:** >> docs\API_REFERENCE.md
echo. >> docs\API_REFERENCE.md
echo ```json >> docs\API_REFERENCE.md
echo { >> docs\API_REFERENCE.md
echo   "username": "string", >> docs\API_REFERENCE.md
echo   "password": "string" >> docs\API_REFERENCE.md
echo } >> docs\API_REFERENCE.md
echo ``` >> docs\API_REFERENCE.md
echo. >> docs\API_REFERENCE.md
echo **Response:** >> docs\API_REFERENCE.md
echo. >> docs\API_REFERENCE.md
echo ```json >> docs\API_REFERENCE.md
echo { >> docs\API_REFERENCE.md
echo   "success": true, >> docs\API_REFERENCE.md
echo   "token": "jwt_token", >> docs\API_REFERENCE.md
echo   "user": { >> docs\API_REFERENCE.md
echo     "UserID": 1, >> docs\API_REFERENCE.md
echo     "Username": "admin", >> docs\API_REFERENCE.md
echo     "FullName": "Administrator", >> docs\API_REFERENCE.md
echo     "Role": "Admin", >> docs\API_REFERENCE.md
echo     "Permissions": ["draft_management", "vote_management", "user_management"] >> docs\API_REFERENCE.md
echo   } >> docs\API_REFERENCE.md
echo } >> docs\API_REFERENCE.md
echo ``` >> docs\API_REFERENCE.md

:: Tạo file DATABASE.md
echo [4/4] Tạo file DATABASE.md...
echo # Database Structure > docs\DATABASE.md
echo. >> docs\DATABASE.md
echo ## Overview >> docs\DATABASE.md
echo. >> docs\DATABASE.md
echo Hệ thống sử dụng SQL Server với các bảng chính: >> docs\DATABASE.md
echo. >> docs\DATABASE.md
echo ## Bảng chính >> docs\DATABASE.md
echo. >> docs\DATABASE.md
echo ### Users >> docs\DATABASE.md
echo. >> docs\DATABASE.md
echo | Column | Type | Description | >> docs\DATABASE.md
echo | ------ | ---- | ----------- | >> docs\DATABASE.md
echo | UserID | int | Primary Key, Identity | >> docs\DATABASE.md
echo | Username | nvarchar(50) | Tên đăng nhập | >> docs\DATABASE.md
echo | Password | nvarchar(200) | Mật khẩu đã hash | >> docs\DATABASE.md
echo | FullName | nvarchar(100) | Tên đầy đủ | >> docs\DATABASE.md
echo | Role | nvarchar(20) | Admin, User, ... | >> docs\DATABASE.md
echo | Email | nvarchar(100) | Email người dùng | >> docs\DATABASE.md
echo | IsActive | bit | Trạng thái hoạt động | >> docs\DATABASE.md
echo | IsDeleted | bit | Đánh dấu đã xóa | >> docs\DATABASE.md
echo | CreatedDate | datetime | Ngày tạo | >> docs\DATABASE.md
echo | DeletedDate | datetime | Ngày xóa | >> docs\DATABASE.md

echo.
echo ╔══════════════════════════════════════════╗
echo ║      TẠO DOCUMENTATION HOÀN TẤT        ║
echo ╚══════════════════════════════════════════╝
echo.
echo Đã tạo các file documentation:
echo  - docs\README.md: Tổng quan dự án
echo  - docs\ARCHITECTURE.md: Kiến trúc hệ thống
echo  - docs\API_REFERENCE.md: Tài liệu API
echo  - docs\DATABASE.md: Cấu trúc database
echo.
pause
