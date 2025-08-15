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
    console.log('🔍 Kiểm tra cấu trúc bảng Votes:');
    
    const columns = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Votes'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Cấu trúc hiện tại:');
    columns.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_DEFAULT || ''}`);
    });

    // Kiểm tra một số phiếu biểu quyết hiện có
    console.log('\n🗳️ Kiểm tra dữ liệu mẫu:');
    const sampleVotes = await sql.query(`
      SELECT TOP 3 VoteID, VoteNumber, Title, Status, CreatedDate
      FROM Votes 
      WHERE IsDeleted = 0
      ORDER BY CreatedDate DESC
    `);
    
    sampleVotes.recordset.forEach(vote => {
      console.log(`  - ${vote.VoteNumber}: ${vote.Title} (${vote.Status})`);
    });
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
