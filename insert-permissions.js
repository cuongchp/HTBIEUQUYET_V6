const sql = require('mssql');

const config = {
  server: 'DUONGVIETCUONG\\SQLEXPRESS',
  database: 'BIEUQUYET_CHP',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    integratedSecurity: true
  }
};

async function insertPermissions() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);
    
    // Get all users
    const usersResult = await pool.request().query('SELECT UserID, Role FROM Users');
    console.log('Found users:', usersResult.recordset);
    
    // Clear existing permissions
    await pool.request().query('DELETE FROM Permissions');
    console.log('Cleared existing permissions');
    
    const modules = ['draft', 'create', 'vote', 'result', 'history', 'document', 'admin'];
    
    for (const user of usersResult.recordset) {
      console.log(`Creating permissions for user ${user.UserID} (${user.Role})`);
      
      for (const module of modules) {
        let canAccess = 0;
        
        if (user.Role === 'Admin') {
          canAccess = 1; // Admin có tất cả quyền
        } else {
          // User thường có một số quyền
          if (['draft', 'vote', 'history', 'document'].includes(module)) {
            canAccess = 1;
          }
        }
        
        await pool.request().query(`
          INSERT INTO Permissions (UserID, ModuleName, CanAccess) 
          VALUES (${user.UserID}, '${module}', ${canAccess})
        `);
      }
    }
    
    // Verify results
    const checkResult = await pool.request().query(`
      SELECT u.FullName, u.Role, p.ModuleName, p.CanAccess 
      FROM Users u 
      LEFT JOIN Permissions p ON u.UserID = p.UserID 
      ORDER BY u.UserID, p.ModuleName
    `);
    
    console.log('Final permissions:');
    console.table(checkResult.recordset);
    
    await pool.close();
    console.log('✅ Permissions created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

insertPermissions();
