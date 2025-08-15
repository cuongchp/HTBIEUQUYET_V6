# Kiến trúc Hệ thống HTBIEUQUYET V6 
 
## Tổng quan 
Hệ thống được xây dựng theo mô hình MVC với: 
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS + Bootstrap 5) 
- **Backend**: Node.js + Express.js 
- **Database**: SQL Server 
- **Authentication**: JWT 
 
## Cấu trúc thư mục 
 
```plaintext 
HTBIEUQUYET_V6/ 
├── controllers/           # Xử lý logic nghiệp vụ 
│   ├── draftsController.js  # Quản lý dự thảo 
│   ├── votesController.js   # Quản lý biểu quyết 
│   └── usersController.js   # Quản lý người dùng 
├── models/                # Tương tác database 
│   ├── draftModel.js      # Model dự thảo 
│   ├── voteModel.js       # Model biểu quyết 
│   └── userModel.js       # Model người dùng 
├── routes/                # Định tuyến API 
├── middleware/            # Middleware 
├── public/                # Frontend 
│   ├── css/ 
│   ├── js/               # JavaScript 
│   │   ├── modules/      # JS modules 
│   └── index.html 
├── config/                # Cấu hình 
├── database/              # SQL scripts 
├── uploads/               # File uploads 
├── docs/                  # Documentation 
├── server.js              # Entry point 
└── package.json           # NPM config 
``` 
