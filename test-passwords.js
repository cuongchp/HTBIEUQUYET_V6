const sql = require('mssql');
const bcrypt = require('bcrypt');

const config = {
  server: 'DUONGVIETCUONG\\SQLEXPRESS',
  database: 'BIEUQUYET_CHP',
  user: 'sa',
  password: '123456',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function testLogin() {
  try {
    const pool = await sql.connect(config);
    
    // Test với password phổ biến
    const testPasswords = ['123456', '123', 'admin123', 'user123', 'password'];
    const testUsers = ['tuanlqa', 'kiemhh', 'anntb'];
    
    console.log('🔑 Testing login for users...\n');
    
    for (const username of testUsers) {
      console.log(`Testing user: ${username}`);
      
      // Get user from database
      const result = await pool.request()
        .input('username', sql.NVarChar, username)
        .query('SELECT Username, Password, IsActive, IsDeleted FROM Users WHERE Username = @username');
      
      if (result.recordset.length === 0) {
        console.log(`❌ User ${username} not found`);
        continue;
      }
      
      const user = result.recordset[0];
      console.log(`User status: IsActive=${user.IsActive}, IsDeleted=${user.IsDeleted}`);
      
      // Test passwords
      for (const testPass of testPasswords) {
        try {
          const isValid = await bcrypt.compare(testPass, user.Password);
          if (isValid) {
            console.log(`✅ FOUND PASSWORD for ${username}: "${testPass}"`);
            break;
          }
        } catch (err) {
          console.log(`❌ Password hash error for ${username}: ${err.message}`);
        }
      }
      console.log('---');
    }
    
    // Test admin account
    console.log('\n🔑 Testing admin account:');
    const adminResult = await pool.request()
      .input('username', sql.NVarChar, 'admin')
      .query('SELECT Username, Password FROM Users WHERE Username = @username');
    
    if (adminResult.recordset.length > 0) {
      const admin = adminResult.recordset[0];
      const isValidAdmin = await bcrypt.compare('admin123', admin.Password);
      console.log(`Admin password "admin123" valid: ${isValidAdmin}`);
    }
    
    await pool.close();
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }
}

testLogin();
