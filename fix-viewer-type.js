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
    console.log('🔌 Kiểm tra và sửa ViewerType...');
    
    // Kiểm tra các dự thảo có ViewerType = null
    const nullViewerType = await sql.query(`
      SELECT DraftID, Title, ViewerType, Status,
             CASE 
               WHEN DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE() THEN 'active'
               ELSE 'closed'
             END as CommentStatus
      FROM Drafts 
      WHERE ViewerType IS NULL
    `);
    
    console.log(`📋 Tìm thấy ${nullViewerType.recordset.length} dự thảo có ViewerType = null:`);
    nullViewerType.recordset.forEach(draft => {
      console.log(`  - ID: ${draft.DraftID}, Title: ${draft.Title}, Status: ${draft.CommentStatus}`);
    });
    
    // Cập nhật ViewerType = 'all' cho các dự thảo null
    if (nullViewerType.recordset.length > 0) {
      const updateResult = await sql.query(`
        UPDATE Drafts 
        SET ViewerType = 'all' 
        WHERE ViewerType IS NULL
      `);
      
      console.log(`✅ Đã cập nhật ${updateResult.rowsAffected[0]} dự thảo từ ViewerType = null thành 'all'`);
    }
    
    // Kiểm tra lại dữ liệu sau khi sửa
    const finalCheck = await sql.query(`
      SELECT DraftID, Title, ViewerType, Status,
             CASE 
               WHEN DATEADD(day, ISNULL(CommentPeriod, 7), CreatedDate) > GETDATE() THEN 'active'
               ELSE 'closed'
             END as CommentStatus
      FROM Drafts 
      ORDER BY DraftID
    `);
    
    console.log('📊 Trạng thái cuối cùng của các dự thảo:');
    finalCheck.recordset.forEach(draft => {
      console.log(`  - ID: ${draft.DraftID}, ViewerType: ${draft.ViewerType}, Status: ${draft.CommentStatus}`);
    });
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
