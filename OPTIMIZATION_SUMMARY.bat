@echo off
cls
echo ================================================================
echo           TOI UU DU AN HTBIEUQUYET V6 HOAN TAT
echo ================================================================
echo.
echo Da hoan tat toi uu du an voi cac cai tien sau:
echo.
echo 1. CAU TRUC DU AN:
echo    - Tao cau truc thu muc theo MVC chuan
echo    - To chuc code thanh cac module ro rang
echo    - Tach biet frontend va backend logic
echo.
echo 2. FRONTEND:
echo    - Chia nho JavaScript thanh cac module:
echo      + auth.js: Xac thuc va quan ly phien
echo      + drafts.js: Quan ly du thao
echo      + votes.js: Quan ly bieu quyet
echo      + admin.js: Quan tri he thong
echo      + utils.js: Ham tien ich
echo    - Tao main.js de khoi tao ung dung
echo.
echo 3. BACKEND:
echo    - Tao controllers theo chuc nang
echo    - Tao models de tuong tac database
echo    - Tao config cho database va app
echo    - Chuan hoa API endpoints
echo.
echo 4. DOCUMENTATION:
echo    - README.md: Huong dan su dung
echo    - ARCHITECTURE.md: Kien truc he thong
echo    - API_REFERENCE.md: Tai lieu API
echo    - DATABASE.md: Cau truc database
echo.
echo 5. CAU HINH:
echo    - .env.example: Template bien moi truong
echo    - .gitignore: Quan ly source control
echo    - package.json: Cap nhat scripts va thong tin
echo    - start.bat: Script khoi dong don gian
echo.
echo CAU TRUC THU MUC SAU TOI UU:
echo HTBIEUQUYET_V6/
echo ├── config/         # Cau hinh
echo ├── controllers/    # Logic nghiep vu
echo ├── models/         # Models database
echo ├── routes/         # API routes
echo ├── middleware/     # Middleware
echo ├── services/       # Business logic
echo ├── public/         # Frontend
echo ├── uploads/        # File uploads
echo ├── database/       # SQL scripts
echo ├── docs/           # Documentation
echo ├── logs/           # Log files
echo ├── .env.example    # Environment template
echo ├── package.json    # NPM config
echo ├── server.js       # Main server
echo └── start.bat       # Startup script
echo.
echo BUOC TIEP THEO:
echo 1. Tao file .env dua tren .env.example
echo 2. Cau hinh database connection string
echo 3. Chay 'npm install' de cai dat dependencies
echo 4. Chay 'start.bat' de khoi dong he thong
echo.
echo LIEN HE HO TRO:
echo Email: support@evncpc.vn
echo Hotline: 1900 1909
echo.
pause
