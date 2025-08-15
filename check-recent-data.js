const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'BIEUQUYET_CHP',
  user: 'sa',
  password: '123456',
  options: { 
    encrypt: false, 
    trustServerCertificate: true 
  }
};

(async () => {
  try {
    await sql.connect(config);
    console.log('🔌 Kiểm tra permissions hiện tại...');
    
    // Kiểm tra dữ liệu permissions mới nhất
    const permissions = await sql.query(`
      SELECT dp.*, d.Title, u.FullName, d.DraftID
      FROM DraftPermissions dp
      INNER JOIN Drafts d ON dp.DraftID = d.DraftID
      INNER JOIN Users u ON dp.UserID = u.UserID
      ORDER BY dp.GrantedDate DESC
    `);
    
    console.log(`📊 Có ${permissions.recordset.length} permissions:`);
    permissions.recordset.forEach(p => {
      console.log(`  - User: ${p.FullName} -> Draft: ${p.Title} (IsActive: ${p.IsActive})`);
    });
    
    // Kiểm tra dự thảo mới nhất
    const latestDrafts = await sql.query(`
      SELECT TOP 5 DraftID, Title, ViewerType, CreatedBy, CreatedDate,
             CASE 
               WHEN DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE() THEN 'active'
               ELSE 'closed'
             END as Status
      FROM Drafts 
      ORDER BY CreatedDate DESC
    `);
    
    console.log('📋 5 dự thảo mới nhất:');
    latestDrafts.recordset.forEach(d => {
      console.log(`  - ID: ${d.DraftID}, Title: ${d.Title}, ViewerType: ${d.ViewerType}, Status: ${d.Status}`);
    });
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
