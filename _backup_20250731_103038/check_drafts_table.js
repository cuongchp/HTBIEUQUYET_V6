const sql = require('mssql');

// SQL Server configuration  
const config = {
  server: 'DUONGVIETCUONG\\SQLEXPRESS',
  database: 'BIEUQUYET_CHP',
  user: 'sa',
  password: '123456',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  port: 1433
};

async function checkDraftsTable() {
  try {
    console.log('🔄 Đang kết nối database...');
    const pool = await sql.connect(config);
    console.log('✅ Kết nối database thành công!');
    
    // Check Drafts table structure
    console.log('🔄 Kiểm tra cấu trúc bảng Drafts...');
    const request = pool.request();
    const result = await request.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Drafts'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Cấu trúc bảng Drafts:');
    result.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if soft delete fields exist
    const softDeleteFields = result.recordset.filter(col => 
      ['IsDeleted', 'DeletedDate', 'DeletedBy'].includes(col.COLUMN_NAME)
    );
    
    console.log(`\n🔍 Soft delete fields (${softDeleteFields.length}/3):`);
    softDeleteFields.forEach(field => {
      console.log(`  ✅ ${field.COLUMN_NAME}: ${field.DATA_TYPE}`);
    });
    
    if (softDeleteFields.length < 3) {
      console.log('\n❌ Một số trường soft delete bị thiếu! Cần chạy database upgrade script.');
    } else {
      console.log('\n✅ Tất cả trường soft delete đã có!');
    }
    
    // Check RecycleBin table
    console.log('\n🔄 Kiểm tra bảng RecycleBin...');
    const recycleBinExists = await request.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'RecycleBin'
    `);
    
    if (recycleBinExists.recordset[0].count > 0) {
      console.log('✅ Bảng RecycleBin tồn tại');
    } else {
      console.log('❌ Bảng RecycleBin chưa được tạo');
    }
    
    await pool.close();
    
  } catch (err) {
    console.error('❌ Database check failed:', err.message);
    if (err.code) {
      console.error('Error code:', err.code);
    }
  }
}

console.log('============================================');
console.log('   KIỂM TRA CẤU TRÚC BẢNG DRAFTS');
console.log('============================================\n');

checkDraftsTable();
