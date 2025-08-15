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
    console.log('🔌 Tạo test draft với permissions...');
    
    const title = 'Test Draft Permission Fix';
    const content = 'Test content cho việc fix permissions';
    const viewerType = 'specific';
    const createdBy = 1; // Admin
    const userIds = [17, 18, 19]; // Lê Quý Anh Tuấn và 2 user khác
    
    // 1. Tạo draft
    const draftResult = await sql.query(`
      INSERT INTO Drafts (Title, Content, AttachedFiles, CreatedBy, CommentPeriod, Status, ViewerType)
      OUTPUT INSERTED.DraftID
      VALUES ('${title}', '${content}', '', ${createdBy}, 7, 'Draft', '${viewerType}')
    `);
    
    const newDraftId = draftResult.recordset[0].DraftID;
    console.log(`✅ Tạo draft thành công với ID: ${newDraftId}`);
    
    // 2. Tạo permissions
    console.log('🔐 Tạo permissions...');
    
    for (const userId of userIds) {
      await sql.query(`
        INSERT INTO DraftPermissions (DraftID, UserID, PermissionType, GrantedBy, GrantedDate, IsActive)
        VALUES (${newDraftId}, ${userId}, 'view', ${createdBy}, GETDATE(), 1)
      `);
      
      console.log(`✅ Tạo permission cho UserID: ${userId}`);
    }
    
    // 3. Kiểm tra kết quả
    const permissions = await sql.query(`
      SELECT dp.*, u.FullName 
      FROM DraftPermissions dp
      INNER JOIN Users u ON dp.UserID = u.UserID
      WHERE dp.DraftID = ${newDraftId}
    `);
    
    console.log(`📊 Tổng permissions đã tạo: ${permissions.recordset.length}`);
    permissions.recordset.forEach(p => {
      console.log(`   - User: ${p.FullName} (ID: ${p.UserID})`);
    });
    
    // 4. Test query như trong backend
    const testQuery = await sql.query(`
      SELECT d.DraftID, d.Title, d.ViewerType,
             CASE 
               WHEN DATEADD(day, ISNULL(d.CommentPeriod, 7), d.CreatedDate) > GETDATE() THEN 'active'
               ELSE 'closed'
             END as CommentStatus
      FROM Drafts d
      WHERE d.IsDeleted = 0 
      AND (
        d.ViewerType = 'all' 
        OR d.CreatedBy = 17
        OR EXISTS (
          SELECT 1 FROM DraftPermissions dp 
          WHERE dp.DraftID = d.DraftID 
          AND dp.UserID = 17 
          AND dp.PermissionType = 'view' 
          AND dp.IsActive = 1
        )
      )
      AND d.DraftID = ${newDraftId}
    `);
    
    console.log(`🔍 Test query cho User ID 17:`);
    if (testQuery.recordset.length > 0) {
      console.log(`   ✅ User 17 SẼ THẤY draft ID ${newDraftId}`);
    } else {
      console.log(`   ❌ User 17 KHÔNG thấy draft ID ${newDraftId}`);
    }
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
