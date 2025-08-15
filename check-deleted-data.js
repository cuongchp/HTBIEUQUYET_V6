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
    
    console.log('📊 DỮ LIỆU BỊ XÓA MỀM:');
    const deleted = await pool.request().query(`
      SELECT DraftID, Title, DeletedDate, DeletedBy 
      FROM Drafts 
      WHERE IsDeleted = 1 
      ORDER BY DeletedDate DESC
    `);
    console.log(`Số dự thảo bị xóa mềm: ${deleted.recordset.length}`);
    deleted.recordset.forEach(d => {
      console.log(`- ID ${d.DraftID}: "${d.Title}" (Xóa: ${d.DeletedDate})`);
    });
    
    console.log('\n📊 TỔNG SỐ RECORD TRONG BẢNG DRAFTS:');
    const total = await pool.request().query('SELECT COUNT(*) as Total FROM Drafts');
    console.log('Tổng số drafts:', total.recordset[0].Total);
    
    console.log('\n📊 KIỂM TRA NULL VALUES:');
    const nullCheck = await pool.request().query(`
      SELECT 
        COUNT(*) as Total,
        SUM(CASE WHEN IsDeleted IS NULL THEN 1 ELSE 0 END) as NullIsDeleted,
        SUM(CASE WHEN IsDeleted = 1 THEN 1 ELSE 0 END) as SoftDeleted,
        SUM(CASE WHEN IsDeleted = 0 THEN 1 ELSE 0 END) as Active
      FROM Drafts
    `);
    
    const stats = nullCheck.recordset[0];
    console.log(`Total: ${stats.Total}`);
    console.log(`IsDeleted = NULL: ${stats.NullIsDeleted}`);
    console.log(`IsDeleted = 1 (soft deleted): ${stats.SoftDeleted}`);  
    console.log(`IsDeleted = 0 (active): ${stats.Active}`);
    
    await pool.close();
    
    console.log('\n💡 PHÂN TÍCH:');
    if (stats.NullIsDeleted > 0) {
      console.log('❌ CÓ DỮ LIỆU VỚI IsDeleted = NULL!');
      console.log('🔧 Cần UPDATE những record này để có giá trị IsDeleted');
    }
    
    if (stats.Active === 1 && stats.Total > 1) {
      console.log('❌ Hầu hết dữ liệu bị ẩn do IsDeleted!');
      console.log('🔧 Cần khôi phục dữ liệu từ backup hoặc reset IsDeleted');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
