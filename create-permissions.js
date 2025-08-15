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
    console.log('🔌 Tạo permissions cho dự thảo...');
    
    // Lấy dữ liệu dự thảo cần permissions
    const drafts = await sql.query(`
      SELECT DraftID, Title, ViewerType, Status 
      FROM Drafts 
      WHERE ViewerType = 'specific' 
      AND (CASE 
             WHEN DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE() THEN 'active'
             ELSE 'closed'
           END) = 'active'
    `);
    
    console.log(`📋 Tìm thấy ${drafts.recordset.length} dự thảo cần permissions:`);
    drafts.recordset.forEach(draft => {
      console.log(`  - ID: ${draft.DraftID}, Title: ${draft.Title}`);
    });
    
    // Lấy danh sách user (không phải Admin)
    const users = await sql.query(`
      SELECT UserID, FullName, Role 
      FROM Users 
      WHERE Role != 'Admin' AND IsDeleted != 1
    `);
    
    console.log(`👥 Tìm thấy ${users.recordset.length} user có thể cấp quyền:`);
    users.recordset.forEach(user => {
      console.log(`  - ID: ${user.UserID}, Name: ${user.FullName}, Role: ${user.Role}`);
    });
    
    // Tạo permissions cho mỗi dự thảo và user
    let permissionsCreated = 0;
    
    for (const draft of drafts.recordset) {
      for (const user of users.recordset) {
        // Kiểm tra permission đã tồn tại chưa
        const existing = await sql.query(`
          SELECT ID FROM DraftPermissions 
          WHERE DraftID = ${draft.DraftID} AND UserID = ${user.UserID}
        `);
        
        if (existing.recordset.length === 0) {
          // Tạo permission mới
          await sql.query(`
            INSERT INTO DraftPermissions (DraftID, UserID, PermissionType, GrantedBy, GrantedDate, IsActive)
            VALUES (${draft.DraftID}, ${user.UserID}, 'view', 1, GETDATE(), 1)
          `);
          
          console.log(`✅ Tạo permission: Draft ${draft.DraftID} cho User ${user.UserID} (${user.FullName})`);
          permissionsCreated++;
        } else {
          console.log(`⚠️ Permission đã tồn tại: Draft ${draft.DraftID} cho User ${user.UserID}`);
        }
      }
    }
    
    console.log(`🎉 Đã tạo ${permissionsCreated} permissions mới!`);
    
    // Kiểm tra lại
    const totalPermissions = await sql.query('SELECT COUNT(*) as Total FROM DraftPermissions WHERE IsActive = 1');
    console.log(`📊 Tổng số permissions hiện tại: ${totalPermissions.recordset[0].Total}`);
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
