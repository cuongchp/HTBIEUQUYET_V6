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
    console.log('🔌 Tạo bảng DraftAgreements...');
    
    // Kiểm tra bảng có tồn tại chưa
    const tableCheck = await sql.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'DraftAgreements'
    `);
    
    if (tableCheck.recordset.length > 0) {
      console.log('✅ Bảng DraftAgreements đã tồn tại');
    } else {
      // Tạo bảng mới
      await sql.query(`
        CREATE TABLE DraftAgreements (
          ID INT IDENTITY(1,1) PRIMARY KEY,
          DraftID INT NOT NULL,
          UserID INT NOT NULL,
          AgreedDate DATETIME DEFAULT GETDATE(),
          IsActive BIT DEFAULT 1,
          
          FOREIGN KEY (DraftID) REFERENCES Drafts(DraftID),
          FOREIGN KEY (UserID) REFERENCES Users(UserID),
          
          -- Đảm bảo 1 user chỉ thống nhất 1 lần cho 1 dự thảo
          UNIQUE(DraftID, UserID)
        )
      `);
      
      console.log('✅ Đã tạo bảng DraftAgreements thành công!');
    }
    
    // Kiểm tra cấu trúc bảng
    const columns = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'DraftAgreements'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Cấu trúc bảng DraftAgreements:');
    columns.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
