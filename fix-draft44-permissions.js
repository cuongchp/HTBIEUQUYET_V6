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
    console.log('🔌 Sửa permissions cho dự thảo ID 44...');
    
    const draftId = 44; // "Anh Tuấn thấy 2"
    const userIds = [17, 18, 19]; // Lê Quý Anh Tuấn và 2 user khác
    const createdBy = 1; // Admin
    
    // Kiểm tra dự thảo có tồn tại không
    const draftCheck = await sql.query(`
      SELECT DraftID, Title, ViewerType 
      FROM Drafts 
      WHERE DraftID = ${draftId}
    `);
    
    if (draftCheck.recordset.length === 0) {
      console.log(`❌ Không tìm thấy dự thảo ID ${draftId}`);
      return;
    }
    
    const draft = draftCheck.recordset[0];
    console.log(`📋 Dự thảo: "${draft.Title}" - ViewerType: ${draft.ViewerType}`);
    
    // Tạo permissions
    console.log('🔐 Tạo permissions...');
    let permissionsCreated = 0;
    
    for (const userId of userIds) {
      // Kiểm tra permission đã tồn tại chưa
      const existing = await sql.query(`
        SELECT ID FROM DraftPermissions 
        WHERE DraftID = ${draftId} AND UserID = ${userId}
      `);
      
      if (existing.recordset.length === 0) {
        await sql.query(`
          INSERT INTO DraftPermissions (DraftID, UserID, PermissionType, GrantedBy, GrantedDate, IsActive)
          VALUES (${draftId}, ${userId}, 'view', ${createdBy}, GETDATE(), 1)
        `);
        
        console.log(`✅ Tạo permission cho UserID: ${userId}`);
        permissionsCreated++;
      } else {
        console.log(`⚠️ Permission đã tồn tại cho UserID: ${userId}`);
      }
    }
    
    console.log(`🎉 Đã tạo ${permissionsCreated} permissions mới!`);
    
    // Kiểm tra kết quả
    const finalCheck = await sql.query(`
      SELECT dp.*, u.FullName 
      FROM DraftPermissions dp
      INNER JOIN Users u ON dp.UserID = u.UserID
      WHERE dp.DraftID = ${draftId}
    `);
    
    console.log(`📊 Tổng permissions cho dự thảo ID ${draftId}: ${finalCheck.recordset.length}`);
    finalCheck.recordset.forEach(p => {
      console.log(`   - User: ${p.FullName} (ID: ${p.UserID})`);
    });
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
