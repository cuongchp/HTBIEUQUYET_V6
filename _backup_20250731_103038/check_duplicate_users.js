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

async function checkDuplicateUsers() {
  let pool;
  try {
    console.log('🔌 Connecting to database...');
    pool = await sql.connect(config);
    
    // 1. Check for duplicate users
    console.log('\n👥 Checking all users in database...');
    const allUsers = await pool.request().query(`
      SELECT UserID, Username, FullName, Role, IsActive
      FROM Users
      ORDER BY FullName, Username
    `);
    
    console.log('📋 All users:');
    allUsers.recordset.forEach(user => {
      console.log(`  ID: ${user.UserID}, Username: ${user.Username}, FullName: ${user.FullName}, Role: ${user.Role}, Active: ${user.IsActive}`);
    });
    
    // 2. Check for duplicate FullNames
    console.log('\n🔍 Checking for duplicate FullNames...');
    const duplicateNames = await pool.request().query(`
      SELECT FullName, COUNT(*) as Count
      FROM Users
      WHERE IsActive = 1
      GROUP BY FullName
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateNames.recordset.length > 0) {
      console.log('⚠️ Found duplicate FullNames:');
      duplicateNames.recordset.forEach(dup => {
        console.log(`  "${dup.FullName}": ${dup.Count} users`);
      });
      
      // Show details for each duplicate
      for (const dup of duplicateNames.recordset) {
        console.log(`\n📝 Users with FullName "${dup.FullName}":`);
        const details = await pool.request()
          .input('FullName', sql.NVarChar(255), dup.FullName)
          .query(`
            SELECT UserID, Username, FullName, Role, IsActive, CreatedDate
            FROM Users
            WHERE FullName = @FullName
            ORDER BY CreatedDate
          `);
        
        details.recordset.forEach(user => {
          console.log(`    ID: ${user.UserID}, Username: ${user.Username}, Role: ${user.Role}, Created: ${user.CreatedDate}`);
        });
      }
    } else {
      console.log('✅ No duplicate FullNames found');
    }
    
    // 3. Check what API endpoint returns
    console.log('\n🔗 Simulating API query...');
    const apiResult = await pool.request().query(`
      SELECT UserID, Username, FullName, Role, IsActive, CreatedDate
      FROM Users
      WHERE IsActive = 1
      ORDER BY FullName
    `);
    
    console.log('📡 API would return:');
    apiResult.recordset.forEach(user => {
      console.log(`  ID: ${user.UserID}, @${user.Username}, ${user.FullName} (${user.Role})`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

checkDuplicateUsers();
