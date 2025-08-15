const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
  server: 'DUONGVIETCUONG\\SQLEXPRESS',
  database: 'BIEUQUYET_CHP',
  user: 'sa',
  password: '123456',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  port: 1433
};

async function resetPasswords() {
  try {
    const pool = await sql.connect(config);
    console.log('🔄 Đang reset mật khẩu cho tất cả users...');
    
    // Hash new passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const thukyPass = await bcrypt.hash('thuky123', 10);
    const chutichPass = await bcrypt.hash('chutich123', 10);
    const thanhvienPass = await bcrypt.hash('tv123', 10);
    
    // Update passwords
    await pool.request()
      .input('adminPass', sql.NVarChar, adminPass)
      .query("UPDATE Users SET Password = @adminPass WHERE Username = 'admin'");
      
    await pool.request()
      .input('thukyPass', sql.NVarChar, thukyPass)
      .query("UPDATE Users SET Password = @thukyPass WHERE Username = 'thuky'");
      
    await pool.request()
      .input('chutichPass', sql.NVarChar, chutichPass)
      .query("UPDATE Users SET Password = @chutichPass WHERE Username = 'chutich'");
      
    await pool.request()
      .input('thanhvienPass', sql.NVarChar, thanhvienPass)
      .query("UPDATE Users SET Password = @thanhvienPass WHERE Username LIKE 'thanhvien%' OR Username LIKE 'soanthao%'");
    
    console.log('✅ Đã reset mật khẩu cho tất cả users!');
    
    // Test passwords
    console.log('\n🔐 Kiểm tra mật khẩu sau khi reset:');
    
    const users = [
      { username: 'admin', testPassword: 'admin123' },
      { username: 'thuky', testPassword: 'thuky123' },
      { username: 'chutich', testPassword: 'chutich123' },
      { username: 'thanhvien1', testPassword: 'tv123' }
    ];
    
    for (const testUser of users) {
      const result = await pool.request()
        .input('username', sql.NVarChar, testUser.username)
        .query('SELECT Password FROM Users WHERE Username = @username');
        
      if (result.recordset.length > 0) {
        const isValid = await bcrypt.compare(testUser.testPassword, result.recordset[0].Password);
        console.log(`   - ${testUser.username} / ${testUser.testPassword}: ${isValid ? '✅' : '❌'}`);
      }
    }
    
    await pool.close();
    
    console.log('\n📋 TÀI KHOẢN ĐĂNG NHẬP:');
    console.log('==========================================');
    console.log('👨‍💼 admin / admin123     (Quản trị viên)');
    console.log('📝 thuky / thuky123      (Thư ký)');
    console.log('👔 chutich / chutich123   (Chủ tịch)');
    console.log('👥 thanhvien1 / tv123     (Thành viên)');
    console.log('👥 thanhvien2 / tv123     (Thành viên)');
    console.log('👥 thanhvien3 / tv123     (Thành viên)');
    console.log('==========================================');
    console.log('\n✅ Có thể đăng nhập ngay bây giờ!');
    
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
}

resetPasswords();
