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
    console.log('🔌 Theo dõi dự thảo mới nhất...');
    
    // Lấy dự thảo mới nhất
    const latestDraft = await sql.query(`
      SELECT TOP 1 DraftID, Title, ViewerType, CreatedBy, CreatedDate
      FROM Drafts 
      ORDER BY CreatedDate DESC
    `);
    
    if (latestDraft.recordset.length > 0) {
      const draft = latestDraft.recordset[0];
      console.log(`📋 Dự thảo mới nhất: ID ${draft.DraftID} - "${draft.Title}"`);
      console.log(`   ViewerType: ${draft.ViewerType}, CreatedBy: ${draft.CreatedBy}`);
      
      // Kiểm tra permissions cho dự thảo này
      const permissions = await sql.query(`
        SELECT dp.*, u.FullName 
        FROM DraftPermissions dp
        INNER JOIN Users u ON dp.UserID = u.UserID
        WHERE dp.DraftID = ${draft.DraftID}
        ORDER BY dp.GrantedDate DESC
      `);
      
      console.log(`🔑 Permissions cho dự thảo ID ${draft.DraftID}:`);
      if (permissions.recordset.length === 0) {
        console.log('   ❌ KHÔNG có permissions nào!');
        
        if (draft.ViewerType === 'specific') {
          console.log('   ⚠️ Cảnh báo: ViewerType = specific nhưng không có permissions!');
        }
      } else {
        permissions.recordset.forEach(p => {
          console.log(`   ✅ User: ${p.FullName} (ID: ${p.UserID}) - ${p.PermissionType} - Active: ${p.IsActive}`);
        });
      }
      
      // Kiểm tra user Lê Quý Anh Tuấn (ID 17) có permissions không
      const tuanPermission = await sql.query(`
        SELECT * FROM DraftPermissions 
        WHERE DraftID = ${draft.DraftID} AND UserID = 17
      `);
      
      console.log(`👤 User "Lê Quý Anh Tuấn" (ID 17):`);
      if (tuanPermission.recordset.length > 0) {
        console.log(`   ✅ Có permission cho dự thảo ID ${draft.DraftID}`);
      } else {
        console.log(`   ❌ KHÔNG có permission cho dự thảo ID ${draft.DraftID}`);
      }
      
    } else {
      console.log('❌ Không tìm thấy dự thảo nào!');
    }
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
