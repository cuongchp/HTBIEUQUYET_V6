const sql = require('mssql');

const config = {
  server: 'DUONGVIETCUONG\\SQLEXPRESS',
  database: 'BIEUQUYET_CHP',
  user: '',
  password: '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    port: 1433
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function resetPermissions() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    
    console.log('Clearing existing permissions...');
    await pool.request().query('DELETE FROM Permissions');
    
    console.log('Getting all users...');
    const usersResult = await pool.request().query('SELECT UserID, Role FROM Users');
    const users = usersResult.recordset;
    
    const modules = ['draft', 'create', 'vote', 'result', 'history', 'document', 'admin'];
    
    console.log(`Creating permissions for ${users.length} users and ${modules.length} modules...`);
    
    for (const user of users) {
      for (const module of modules) {
        let canAccess = 0;
        
        if (user.Role === 'Admin') {
          canAccess = 1; // Admin có tất cả quyền
        } else {
          // User thường có quyền cơ bản
          if (['vote', 'history', 'document'].includes(module)) {
            canAccess = 1;
          }
        }
        
        await pool.request().query(`
          INSERT INTO Permissions (UserID, ModuleName, CanAccess) 
          VALUES (${user.UserID}, '${module}', ${canAccess})
        `);
      }
      console.log(`✓ Created permissions for user: ${user.UserID}`);
    }
    
    console.log('✅ Permissions reset successfully!');
    await pool.close();
    
  } catch (error) {
    console.error('❌ Error resetting permissions:', error);
  }
}

resetPermissions();
