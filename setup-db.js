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
    enableArithAbort: true,
    port: 1433
  }
};

async function setupDatabase() {
  let pool;
  try {
    console.log('🔗 Connecting to database...');
    pool = await sql.connect(config);
    console.log('✅ Connected successfully');
    
    // Check users
    const usersCount = await pool.request().query('SELECT COUNT(*) as count FROM Users');
    console.log(`👥 Users in database: ${usersCount.recordset[0].count}`);
    
    if (usersCount.recordset[0].count === 0) {
      console.log('📝 Creating sample users...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.request().query(`
        INSERT INTO Users (Username, Password, FullName, Role) 
        VALUES ('admin', '${hashedPassword}', N'Administrator', 'Admin')
      `);
      
      const users = [
        { username: 'user1', fullname: 'Lê Văn Thuyết - CT HĐQT', role: 'User' },
        { username: 'user2', fullname: 'Nguyễn Trần Bảo An - TV HĐQT', role: 'User' },
        { username: 'user3', fullname: 'Nguyễn Đức An - TV HĐQT', role: 'User' },
        { username: 'user4', fullname: 'Bùi Thế Huy - TV HĐQT', role: 'User' },
        { username: 'user5', fullname: 'Nguyễn Phong Danh - TV HĐQT', role: 'User' }
      ];
      
      for (const user of users) {
        const hashedPwd = await bcrypt.hash('123456', 10);
        await pool.request().query(`
          INSERT INTO Users (Username, Password, FullName, Role) 
          VALUES ('${user.username}', '${hashedPwd}', N'${user.fullname}', '${user.role}')
        `);
      }
      console.log('✅ Sample users created');
    }
    
    // Check permissions
    const permissionsCount = await pool.request().query('SELECT COUNT(*) as count FROM Permissions');
    console.log(`🔑 Permissions in database: ${permissionsCount.recordset[0].count}`);
    
    if (permissionsCount.recordset[0].count === 0) {
      console.log('🔐 Creating permissions...');
      
      const allUsers = await pool.request().query('SELECT UserID, Role FROM Users');
      const modules = ['draft', 'create', 'vote', 'result', 'history', 'document', 'admin'];
      
      for (const user of allUsers.recordset) {
        for (const module of modules) {
          let canAccess = 0;
          
          if (user.Role === 'Admin') {
            canAccess = 1;
          } else {
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
      console.log('✅ Permissions created');
    }
    
    // Final check
    const finalUsers = await pool.request().query('SELECT UserID, FullName, Role FROM Users');
    const finalPermissions = await pool.request().query(`
      SELECT u.FullName, p.ModuleName, p.CanAccess 
      FROM Users u 
      JOIN Permissions p ON u.UserID = p.UserID 
      WHERE p.CanAccess = 1
      ORDER BY u.UserID, p.ModuleName
    `);
    
    console.log('\n📊 Final Summary:');
    console.log(`👥 Total Users: ${finalUsers.recordset.length}`);
    console.log(`🔑 Total Active Permissions: ${finalPermissions.recordset.length}`);
    
    console.log('\n👥 Users:');
    finalUsers.recordset.forEach(user => {
      console.log(`  - ${user.FullName} (${user.Role})`);
    });
    
    console.log('\n🔑 Sample Permissions:');
    finalPermissions.recordset.slice(0, 10).forEach(perm => {
      console.log(`  - ${perm.FullName}: ${perm.ModuleName}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

setupDatabase().then(() => {
  console.log('\n🎉 Database setup completed!');
  process.exit(0);
});
