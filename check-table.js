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
    console.log('🔌 Kiểm tra bảng DraftPermissions...');
    
    // Kiểm tra bảng có tồn tại
    const tables = await sql.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'DraftPermissions'
    `);
    
    if (tables.recordset.length === 0) {
      console.log('❌ Bảng DraftPermissions KHÔNG tồn tại!');
      
      // Kiểm tra các bảng liên quan
      console.log('🔍 Tìm các bảng có chứa "Draft" hoặc "Permission":');
      const relatedTables = await sql.query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME LIKE '%Draft%' OR TABLE_NAME LIKE '%Permission%'
        ORDER BY TABLE_NAME
      `);
      
      relatedTables.recordset.forEach(table => {
        console.log(`  - ${table.TABLE_NAME}`);
      });
      
    } else {
      console.log('✅ Bảng DraftPermissions tồn tại');
      
      // Xem cấu trúc bảng
      const columns = await sql.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'DraftPermissions'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('📋 Cấu trúc bảng:');
      columns.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Xem dữ liệu
      const data = await sql.query('SELECT * FROM DraftPermissions');
      console.log(`📊 Có ${data.recordset.length} bản ghi permissions`);
      
      if (data.recordset.length > 0) {
        console.log('🔍 Dữ liệu mẫu:');
        data.recordset.slice(0, 5).forEach(row => {
          console.log(`  - DraftID: ${row.DraftID}, UserID: ${row.UserID}`);
        });
      }
    }
    
    await sql.close();
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
})();
