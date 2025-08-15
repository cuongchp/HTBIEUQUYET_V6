const sql = require('mssql');

(async () => {
  try {
    const pool = await sql.connect({
      server: 'localhost',
      user: 'sa',
      password: '123456',
      database: 'BIEUQUYET_CHP',
      options: { encrypt: false, trustServerCertificate: true }
    });
    
    await pool.request().query(`
      INSERT INTO Drafts (Title, Content, CreatedBy, CreatedDate, Status, CommentPeriod, ViewerType, IsDeleted)
      VALUES (N'Dự thảo để test xóa qua UI', N'Nội dung test xóa qua giao diện người dùng', 1, GETDATE(), N'Đang mở góp ý', 7, 'all', 0)
    `);
    
    console.log('✅ Created draft for UI testing');
    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
