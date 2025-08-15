const sql = require('mssql');

const config = {
  user: 'sa',
  password: '123456',
  server: 'localhost',
  database: 'VotingSystemDB',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function checkAndAddPermissions() {
  try {
    console.log('🔌 Connecting to database...');
    const pool = await sql.connect(config);
    
    // 1. Check existing permissions
    console.log('\n📋 Checking existing permissions...');
    const permResult = await pool.request().query(`
      SELECT u.Username, u.FullName, p.ModuleName, p.CanAccess
      FROM Users u
      LEFT JOIN Permissions p ON u.UserID = p.UserID
      WHERE u.IsActive = 1
      ORDER BY u.Username, p.ModuleName
    `);
    
    console.log('Current permissions:');
    permResult.recordset.forEach(row => {
      console.log(`  ${row.Username} (${row.FullName}): ${row.ModuleName || 'No permissions'} = ${row.CanAccess || 'N/A'}`);
    });
    
    // 2. Get all users
    console.log('\n👥 Getting all users...');
    const usersResult = await pool.request().query(`
      SELECT UserID, Username, FullName, Role
      FROM Users
      WHERE IsActive = 1
    `);
    
    console.log('Active users:');
    usersResult.recordset.forEach(user => {
      console.log(`  ID: ${user.UserID}, Username: ${user.Username}, FullName: ${user.FullName}, Role: ${user.Role}`);
    });
    
    // 3. Check if create_draft permission exists for non-admin users
    console.log('\n🔍 Checking create_draft permissions...');
    const createDraftCheck = await pool.request().query(`
      SELECT u.Username, u.Role, p.ModuleName, p.CanAccess
      FROM Users u
      LEFT JOIN Permissions p ON u.UserID = p.UserID AND p.ModuleName = 'create_draft'
      WHERE u.IsActive = 1
    `);
    
    console.log('create_draft permissions:');
    createDraftCheck.recordset.forEach(row => {
      console.log(`  ${row.Username} (${row.Role}): create_draft = ${row.CanAccess || 'NOT SET'}`);
    });
    
    // 4. Add create_draft permission for a test user (non-admin)
    console.log('\n➕ Adding create_draft permission for non-admin users...');
    const nonAdminUsers = usersResult.recordset.filter(u => u.Role !== 'Admin');
    
    if (nonAdminUsers.length > 0) {
      const testUser = nonAdminUsers[0]; // Take first non-admin user
      console.log(`Adding create_draft permission for: ${testUser.Username}`);
      
      // Check if permission already exists
      const existingPerm = await pool.request()
        .input('UserID', sql.Int, testUser.UserID)
        .query(`
          SELECT * FROM Permissions 
          WHERE UserID = @UserID AND ModuleName = 'create_draft'
        `);
      
      if (existingPerm.recordset.length === 0) {
        // Insert new permission
        await pool.request()
          .input('UserID', sql.Int, testUser.UserID)
          .input('ModuleName', sql.NVarChar(100), 'create_draft')
          .input('CanAccess', sql.Bit, 1)
          .query(`
            INSERT INTO Permissions (UserID, ModuleName, CanAccess, CreatedDate)
            VALUES (@UserID, @ModuleName, @CanAccess, GETDATE())
          `);
        console.log(`✅ Added create_draft permission for ${testUser.Username}`);
      } else {
        // Update existing permission
        await pool.request()
          .input('UserID', sql.Int, testUser.UserID)
          .input('ModuleName', sql.NVarChar(100), 'create_draft')
          .input('CanAccess', sql.Bit, 1)
          .query(`
            UPDATE Permissions 
            SET CanAccess = @CanAccess, ModifiedDate = GETDATE()
            WHERE UserID = @UserID AND ModuleName = @ModuleName
          `);
        console.log(`✅ Updated create_draft permission for ${testUser.Username}`);
      }
    }
    
    console.log('\n✅ Permission check completed!');
    
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    sql.close();
  }
}

checkAndAddPermissions();
