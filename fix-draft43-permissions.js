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
    console.log('🔌 Tạo permissions cho dự thảo ID 43...');
    
    const draftId = 43; // "Anh Tuấn Thấy 1"
    
    // Lấy thông tin draft và creator
    const draftInfo = await sql.query(`
      SELECT DraftID, Title, CreatedBy, ViewerType
      FROM Drafts 
      WHERE DraftID = ${draftId}
    `);
    
    if (draftInfo.recordset.length === 0) {
      console.log('❌ Không tìm thấy dự thảo ID 43');
      return;
    }
    
    const draft = draftInfo.recordset[0];
    console.log(`📋 Dự thảo: ${draft.Title}, ViewerType: ${draft.ViewerType}, CreatedBy: ${draft.CreatedBy}`);
    
    if (draft.ViewerType === 'specific') {
      // Lấy danh sách user (không phải Admin) 
      const users = await sql.query(`
        SELECT UserID, FullName, Role 
        FROM Users 
        WHERE Role != 'Admin' AND IsDeleted != 1
      `);
      
      console.log(`👥 Tìm thấy ${users.recordset.length} user để cấp quyền:`);
      
      let permissionsCreated = 0;
      
      // Tạo permissions cho tất cả user (giống như dự thảo 42)
      for (const user of users.recordset) {
        // Kiểm tra permission đã tồn tại chưa
        const existing = await sql.query(`
          SELECT ID FROM DraftPermissions 
          WHERE DraftID = ${draftId} AND UserID = ${user.UserID}
        `);
        
        if (existing.recordset.length === 0) {
          // Tạo permission mới
          await sql.query(`
            INSERT INTO DraftPermissions (DraftID, UserID, PermissionType, GrantedBy, GrantedDate, IsActive)
            VALUES (${draftId}, ${user.UserID}, 'view', ${draft.CreatedBy}, GETDATE(), 1)
          `);
          
          console.log(`✅ Tạo permission cho User ${user.UserID} (${user.FullName})`);
          permissionsCreated++;
        } else {
          console.log(`⚠️ Permission đã tồn tại cho User ${user.UserID}`);
        }
      }
      
      console.log(`🎉 Đã tạo ${permissionsCreated} permissions mới cho dự thảo ID ${draftId}!`);
      
      // Kiểm tra lại
      const finalCheck = await sql.query(`
        SELECT COUNT(*) as Total 
        FROM DraftPermissions 
        WHERE DraftID = ${draftId} AND IsActive = 1
      `);
      console.log(`📊 Tổng permissions cho dự thảo ID ${draftId}: ${finalCheck.recordset[0].Total}`);
      
    } else {
      console.log('ℹ️ Dự thảo không phải loại "specific", không cần tạo permissions');
    }
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
