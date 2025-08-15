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
    console.log('🔌 Kiểm tra tổng quan dự thảo active...');
    
    // Lấy tất cả dự thảo active
    const activeDrafts = await sql.query(`
      SELECT DraftID, Title, ViewerType, CreatedBy,
             CASE 
               WHEN DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE() THEN 'active'
               ELSE 'closed'
             END as Status
      FROM Drafts 
      WHERE IsDeleted = 0
      AND DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE()
      ORDER BY CreatedDate DESC
    `);
    
    console.log(`📋 Tìm thấy ${activeDrafts.recordset.length} dự thảo ACTIVE:`);
    
    for (const draft of activeDrafts.recordset) {
      console.log(`\n🔸 ID ${draft.DraftID}: "${draft.Title}"`);
      console.log(`   ViewerType: ${draft.ViewerType}, CreatedBy: ${draft.CreatedBy}`);
      
      if (draft.ViewerType === 'specific') {
        // Kiểm tra permissions
        const permissions = await sql.query(`
          SELECT dp.UserID, u.FullName 
          FROM DraftPermissions dp
          INNER JOIN Users u ON dp.UserID = u.UserID
          WHERE dp.DraftID = ${draft.DraftID} AND dp.IsActive = 1
        `);
        
        if (permissions.recordset.length === 0) {
          console.log(`   ❌ KHÔNG có permissions!`);
        } else {
          console.log(`   ✅ Có ${permissions.recordset.length} permissions:`);
          permissions.recordset.forEach(p => {
            console.log(`      - ${p.FullName} (ID: ${p.UserID})`);
          });
        }
        
        // Kiểm tra Lê Quý Anh Tuấn có permission không
        const tuanPermission = permissions.recordset.find(p => p.UserID === 17);
        if (tuanPermission) {
          console.log(`   🎯 Lê Quý Anh Tuấn CÓ QUYỀN xem`);
        } else {
          console.log(`   ⚠️ Lê Quý Anh Tuấn KHÔNG có quyền xem`);
        }
        
      } else if (draft.ViewerType === 'all') {
        console.log(`   🌍 Công khai - tất cả user thấy được`);
      } else {
        console.log(`   ❓ ViewerType không xác định: ${draft.ViewerType}`);
      }
    }
    
    // Test query backend cho user 17
    console.log(`\n🔍 TEST QUERY CHO USER 17:`);
    const userDrafts = await sql.query(`
      SELECT d.DraftID, d.Title, d.ViewerType
      FROM Drafts d
      WHERE d.IsDeleted = 0 
      AND DATEADD(day, ISNULL(d.CommentPeriod, 7), d.CreatedDate) > GETDATE()
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
      ORDER BY d.CreatedDate DESC
    `);
    
    console.log(`📊 User 17 sẽ thấy ${userDrafts.recordset.length} dự thảo active:`);
    userDrafts.recordset.forEach(d => {
      console.log(`   ✅ ID ${d.DraftID}: "${d.Title}" (${d.ViewerType})`);
    });
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
