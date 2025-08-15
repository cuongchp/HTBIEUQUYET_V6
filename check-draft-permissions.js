const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'BIEUQUYET_CHP',
  user: 'sa',
  password: '123456',
  options: { 
    encrypt: false, 
    trustServerCertificate: true, 
    enableArithAbort: true 
  }
};

async function checkData() {
  try {
    await sql.connect(config);
    console.log('🔌 Connected to database');
    
    // Check drafts
    const drafts = await sql.query(`
      SELECT DraftID, Title, CreatedBy, ViewerType, Status, 
             CASE 
               WHEN DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE() THEN 'active'
               ELSE 'closed'
             END as CommentStatus
      FROM Drafts 
      WHERE IsDeleted = 0
    `);
    console.log('📄 Total drafts:', drafts.recordset.length);
    console.log('Draft details:');
    drafts.recordset.forEach(d => {
      console.log(`  - ID: ${d.DraftID}, Title: ${d.Title}, ViewerType: ${d.ViewerType}, Status: ${d.CommentStatus}`);
    });
    
    // Check draft permissions
    const permissions = await sql.query(`
      SELECT dp.*, u.FullName, d.Title 
      FROM DraftPermissions dp 
      INNER JOIN Users u ON dp.UserID = u.UserID 
      INNER JOIN Drafts d ON dp.DraftID = d.DraftID 
      WHERE dp.IsActive = 1
    `);
    console.log('\n🔑 Total active permissions:', permissions.recordset.length);
    console.log('Permission details:');
    permissions.recordset.forEach(p => {
      console.log(`  - ${p.FullName} -> ${p.Title} (${p.PermissionType})`);
    });
    
    // Check users
    const users = await sql.query('SELECT UserID, FullName, Role FROM Users WHERE IsDeleted = 0');
    console.log('\n👥 Users:');
    users.recordset.forEach(u => {
      console.log(`  - ID: ${u.UserID}, Name: ${u.FullName}, Role: ${u.Role}`);
    });
    
    await sql.close();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkData();
