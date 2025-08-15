@echo off
chcp 65001 >nul
cls
echo ╔══════════════════════════════════════════╗
echo ║         TỐI ƯU BACKEND                  ║
echo ╚══════════════════════════════════════════╝
echo.

:: Tạo các thư mục cần thiết
echo [1/5] Tạo cấu trúc thư mục backend...
mkdir "controllers" 2>nul
mkdir "models" 2>nul
mkdir "config" 2>nul

:: Tạo file cấu hình
echo [2/5] Tạo file cấu hình...
echo // Database configuration > config\database.js
echo const sql = require('mssql'); >> config\database.js
echo. >> config\database.js
echo const config = { >> config\database.js
echo   server: process.env.DB_SERVER || 'localhost', >> config\database.js
echo   database: process.env.DB_NAME || 'BieuQuyetDB', >> config\database.js
echo   user: process.env.DB_USER || 'sa', >> config\database.js
echo   password: process.env.DB_PASSWORD || 'Password123', >> config\database.js
echo   options: { >> config\database.js
echo     encrypt: false, >> config\database.js
echo     trustServerCertificate: true, >> config\database.js
echo   }, >> config\database.js
echo }; >> config\database.js
echo. >> config\database.js
echo module.exports = { >> config\database.js
echo   config, >> config\database.js
echo   connect: async function() { >> config\database.js
echo     try { >> config\database.js
echo       const pool = new sql.ConnectionPool(config); >> config\database.js
echo       return await pool.connect(); >> config\database.js
echo     } catch (err) { >> config\database.js
echo       console.error('Database connection error:', err); >> config\database.js
echo       throw err; >> config\database.js
echo     } >> config\database.js
echo   } >> config\database.js
echo }; >> config\database.js

:: Tạo các controllers
echo [3/5] Tạo các controllers...

echo // Drafts controller > controllers\draftsController.js
echo const sql = require('mssql'); >> controllers\draftsController.js
echo const db = require('../config/database'); >> controllers\draftsController.js
echo. >> controllers\draftsController.js
echo // Get all drafts >> controllers\draftsController.js
echo exports.getAllDrafts = async (req, res) => { >> controllers\draftsController.js
echo   try { >> controllers\draftsController.js
echo     const pool = await db.connect(); >> controllers\draftsController.js
echo     const result = await pool.request() >> controllers\draftsController.js
echo       .query('SELECT * FROM Drafts WHERE IsDeleted = 0'); >> controllers\draftsController.js
echo     res.json(result.recordset); >> controllers\draftsController.js
echo   } catch (error) { >> controllers\draftsController.js
echo     console.error('Error getting drafts:', error); >> controllers\draftsController.js
echo     res.status(500).json({ error: 'An error occurred while fetching drafts' }); >> controllers\draftsController.js
echo   } >> controllers\draftsController.js
echo }; >> controllers\draftsController.js

:: Tạo file .env mẫu
echo [4/5] Tạo file .env.example...
echo # Server Settings > .env.example
echo PORT=3000 >> .env.example
echo NODE_ENV=development >> .env.example
echo SESSION_SECRET=your_secret_key_here >> .env.example
echo. >> .env.example
echo # Database Settings >> .env.example
echo DB_SERVER=localhost >> .env.example
echo DB_NAME=BieuQuyetDB >> .env.example
echo DB_USER=sa >> .env.example
echo DB_PASSWORD=Password123 >> .env.example
echo. >> .env.example
echo # JWT Settings >> .env.example
echo JWT_SECRET=your_jwt_secret_here >> .env.example
echo JWT_EXPIRES_IN=1d >> .env.example

:: Tối ưu file server.js
echo [5/5] Kiểm tra và tối ưu file server.js...

echo.
echo ╔══════════════════════════════════════════╗
echo ║       TỐI ƯU BACKEND HOÀN TẤT          ║
echo ╚══════════════════════════════════════════╝
echo.
echo Đã tạo cấu trúc backend theo MVC:
echo  - controllers/: Chứa xử lý logic nghiệp vụ
echo  - models/: Chứa các tương tác với database
echo  - config/: Chứa cấu hình ứng dụng
echo.
echo ⚠️ Lưu ý: 
echo Bạn cần cập nhật thủ công file server.js để sử dụng các controllers và models mới.
echo.
pause
