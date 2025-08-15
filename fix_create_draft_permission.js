const sql = require('mssql');

const config = {
  server: 'DUONGVIETCUONG\\SQLEXPRESS',
  database: 'BIEUQUYET_CHP',
  user: 'sa',
  password: '123456',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function addCreateDraftPermission() {
  try {
    console.log('🔌 Connecting to database...');
    const pool = await sql.connect(config);
    
    // 1. Find a non-admin user
    console.log('\n👥 Finding non-admin users...');
    const users = await pool.request().query(`
      SELECT UserID, Username, FullName, Role
      FROM Users
      WHERE Role != 'Admin' AND IsActive = 1
    `);
    
    if (users.recordset.length === 0) {
      console.log('❌ No non-admin users found');
      return;
    }
    
    const targetUser = users.recordset[0];
    console.log(`🎯 Target user: ${targetUser.Username} (${targetUser.FullName})`);
    
    // 2. Check current permissions
    console.log('\n🔍 Checking current permissions...');
    const currentPerms = await pool.request()
      .input('UserID', sql.Int, targetUser.UserID)
      .query(`
        SELECT ModuleName, CanAccess
        FROM Permissions
        WHERE UserID = @UserID
      `);
    
    console.log('Current permissions:');
    currentPerms.recordset.forEach(perm => {
      console.log(`  - ${perm.ModuleName}: ${perm.CanAccess}`);
    });
    
    // 3. Add create_draft permission
    console.log('\n➕ Adding create_draft permission...');
    
    // Check if already exists
    const exists = await pool.request()
      .input('UserID', sql.Int, targetUser.UserID)
      .input('ModuleName', sql.NVarChar(100), 'create_draft')
      .query(`
        SELECT * FROM Permissions
        WHERE UserID = @UserID AND ModuleName = @ModuleName
      `);
    
    if (exists.recordset.length === 0) {
      // Insert new permission
      await pool.request()
        .input('UserID', sql.Int, targetUser.UserID)
        .input('ModuleName', sql.NVarChar(100), 'create_draft')
        .input('CanAccess', sql.Bit, 1)
        .query(`
          INSERT INTO Permissions (UserID, ModuleName, CanAccess, CreatedDate)
          VALUES (@UserID, @ModuleName, @CanAccess, GETDATE())
        `);
      console.log('✅ Permission added');
    } else {
      // Update existing
      await pool.request()
        .input('UserID', sql.Int, targetUser.UserID)
        .input('ModuleName', sql.NVarChar(100), 'create_draft')
        .input('CanAccess', sql.Bit, 1)
        .query(`
          UPDATE Permissions
          SET CanAccess = @CanAccess, ModifiedDate = GETDATE()
          WHERE UserID = @UserID AND ModuleName = @ModuleName
        `);
      console.log('✅ Permission updated');
    }
    
    // 4. Verify
    console.log('\n✅ Verification - Final permissions:');
    const finalPerms = await pool.request()
      .input('UserID', sql.Int, targetUser.UserID)
      .query(`
        SELECT ModuleName, CanAccess
        FROM Permissions
        WHERE UserID = @UserID
      `);
    
    finalPerms.recordset.forEach(perm => {
      console.log(`  - ${perm.ModuleName}: ${perm.CanAccess}`);
    });
    
    console.log(`\n🎯 Test with user: ${targetUser.Username}`);
    console.log(`   Expected: Should be able to access /api/admin/users`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    sql.close();
  }
}

addCreateDraftPermission();
