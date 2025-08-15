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

async function checkPasswords() {
  try {
    const pool = await sql.connect(config);
    
    console.log('🔑 Password hashes in database:\n');
    
    const result = await pool.request()
      .query('SELECT Username, Password, LEN(Password) as PasswordLength FROM Users ORDER BY Username');
    
    result.recordset.forEach(user => {
      console.log(`User: ${user.Username}`);
      console.log(`Password hash: ${user.Password.substring(0, 20)}...`);
      console.log(`Hash length: ${user.PasswordLength}`);
      console.log(`Hash starts with: ${user.Password.substring(0, 4)}`);
      console.log('---');
    });
    
    await pool.close();
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }
}

checkPasswords();
