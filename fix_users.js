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

async function updateUserRoles() {
  try {
    const pool = await sql.connect(config);
    console.log('🔄 Đang cập nhật vai trò users...');
    
    // Update user roles
    await pool.request().query(`
      UPDATE Users SET Role = 'Secretary' WHERE Username = 'thuky';
      UPDATE Users SET Role = 'Chairman' WHERE Username = 'chutich';
      UPDATE Users SET Role = 'Member' WHERE Username LIKE 'thanhvien%';
      UPDATE Users SET Role = 'Member' WHERE Username LIKE 'soanthao%';
    `);
    
    // Clear existing permissions
    await pool.request().query('DELETE FROM Permissions');
    
    // Get all users
    const users = await pool.request().query('SELECT UserID, Username, Role FROM Users');
    
    console.log('👥 Cập nhật quyền cho từng user:');
    
    for (const user of users.recordset) {
      console.log(`   - ${user.Username} (${user.Role})`);
      
      const modules = [
        'dashboard', 'draft_management', 'vote_creation', 'vote_participation',
        'vote_results', 'vote_summary', 'resolution_management', 'document_library',
        'digital_signature', 'user_management'
      ];
      
      for (const module of modules) {
        let canAccess = 1;
        
        // Set permissions based on role
        if (user.Role === 'Admin') {
          canAccess = 1; // Admin can access everything
        } else if (user.Role === 'Secretary') {
          canAccess = (module !== 'user_management') ? 1 : 0;
        } else if (user.Role === 'Chairman') {
          canAccess = (module !== 'user_management') ? 1 : 0;
        } else if (user.Role === 'Member') {
          canAccess = (module !== 'user_management' && module !== 'draft_management') ? 1 : 0;
        }
        
        await pool.request().query(`
          INSERT INTO Permissions (UserID, ModuleName, CanAccess) 
          VALUES (${user.UserID}, '${module}', ${canAccess})
        `);
      }
    }
    
    // Test login with correct password
    console.log('\n🔐 Kiểm tra mật khẩu admin...');
    const adminUser = await pool.request().query("SELECT * FROM Users WHERE Username = 'admin'");
    if (adminUser.recordset.length > 0) {
      const isValid = await bcrypt.compare('admin123', adminUser.recordset[0].Password);
      console.log(`   Admin password valid: ${isValid}`);
    }
    
    // Show final user list
    console.log('\n📋 Danh sách users sau khi cập nhật:');
    const finalUsers = await pool.request().query('SELECT Username, FullName, Role FROM Users ORDER BY Username');
    finalUsers.recordset.forEach(user => {
      console.log(`   - ${user.Username} / ${user.Role} (${user.FullName})`);
    });
    
    await pool.close();
    console.log('\n✅ Cập nhật hoàn tất! Thử đăng nhập lại:');
    console.log('   - admin / admin123');
    console.log('   - thuky / thuky123');  
    console.log('   - chutich / chutich123');
    console.log('   - thanhvien1 / tv123');
    
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
}

updateUserRoles();
