// Test script to add create_draft permission for a user
const sql = require('mssql');

const config = {
  user: 'sa',
  password: '123456',  
  server: 'localhost',
  database: 'VotingSystemDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

async function addCreateDraftPermission() {
  let pool;
  try {
    console.log('🔌 Connecting to database...');
    pool = await sql.connect(config);
    
    // 1. Get all users
    console.log('\n👥 Getting all users...');
    const usersResult = await pool.request().query(`
      SELECT UserID, Username, FullName, Role
      FROM Users
      WHERE IsActive = 1
    `);
    
    console.log('Active users:');
    usersResult.recordset.forEach(user => {
      console.log(`  ID: ${user.UserID}, Username: ${user.Username}, Role: ${user.Role}`);
    });
    
    // 2. Find a non-admin user to give create_draft permission
    const nonAdminUsers = usersResult.recordset.filter(u => u.Role !== 'Admin');
    
    if (nonAdminUsers.length === 0) {
      console.log('❌ No non-admin users found');
      return;
    }
    
    const targetUser = nonAdminUsers[0]; // Take first non-admin user
    console.log(`\n➕ Adding create_draft permission for: ${targetUser.Username} (${targetUser.FullName})`);
    
    // 3. Check if permission already exists
    const existingPerm = await pool.request()
      .input('UserID', sql.Int, targetUser.UserID)
      .query(`
        SELECT * FROM Permissions 
        WHERE UserID = @UserID AND ModuleName = 'create_draft'
      `);
    
    if (existingPerm.recordset.length === 0) {
      // Insert new permission
      await pool.request()
        .input('UserID', sql.Int, targetUser.UserID)
        .input('ModuleName', sql.NVarChar(100), 'create_draft')
        .input('CanAccess', sql.Bit, 1)
        .query(`
          INSERT INTO Permissions (UserID, ModuleName, CanAccess, CreatedDate)
          VALUES (@UserID, @ModuleName, @CanAccess, GETDATE())
        `);
      console.log(`✅ Added create_draft permission for ${targetUser.Username}`);
    } else {
      // Update existing permission
      await pool.request()
        .input('UserID', sql.Int, targetUser.UserID)
        .input('ModuleName', sql.NVarChar(100), 'create_draft')
        .input('CanAccess', sql.Bit, 1)
        .query(`
          UPDATE Permissions 
          SET CanAccess = @CanAccess, ModifiedDate = GETDATE()
          WHERE UserID = @UserID AND ModuleName = @ModuleName
        `);
      console.log(`✅ Updated create_draft permission for ${targetUser.Username}`);
    }
    
    // 4. Verify permission was added
    const verifyResult = await pool.request()
      .input('UserID', sql.Int, targetUser.UserID)
      .query(`
        SELECT u.Username, u.FullName, p.ModuleName, p.CanAccess
        FROM Users u
        LEFT JOIN Permissions p ON u.UserID = p.UserID
        WHERE u.UserID = @UserID
      `);
    
    console.log(`\n🔍 Permissions for ${targetUser.Username}:`);
    verifyResult.recordset.forEach(row => {
      console.log(`  ${row.ModuleName || 'No permissions'}: ${row.CanAccess || 'N/A'}`);
    });
    
    console.log(`\n🎯 Test login with: Username: ${targetUser.Username}`);
    console.log(`   Expected: User should be able to access /api/admin/users for draft creation`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

addCreateDraftPermission();
