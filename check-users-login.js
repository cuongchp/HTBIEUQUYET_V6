const sql = require('mssql');

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

async function checkUsers() {
  try {
    const pool = await sql.connect(config);
    
    console.log('📋 All Users in Database:');
    const result = await pool.request().query('SELECT Username, FullName, Role, IsActive, IsDeleted FROM Users ORDER BY UserID');
    console.table(result.recordset);
    
    console.log('\n✅ Active Users:');
    const activeUsers = result.recordset.filter(u => u.IsActive && !u.IsDeleted);
    console.table(activeUsers);
    
    console.log('\n❌ Inactive/Deleted Users:');
    const inactiveUsers = result.recordset.filter(u => !u.IsActive || u.IsDeleted);
    console.table(inactiveUsers);
    
    // Check specific user account
    console.log('\n🔍 Checking specific user accounts:');
    const adminCheck = await pool.request()
      .input('username', sql.NVarChar, 'admin')
      .query('SELECT Username, FullName, Role, IsActive, IsDeleted FROM Users WHERE Username = @username');
    
    console.log('Admin account:', adminCheck.recordset[0] || 'Not found');
    
    // Check if there are any other users
    const userCheck = await pool.request()
      .query('SELECT Username, FullName, Role, IsActive, IsDeleted FROM Users WHERE Role != \'Admin\'');
    
    console.log('\n👥 Non-admin users:');
    console.table(userCheck.recordset);
    
    await pool.close();
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }
}

checkUsers();
