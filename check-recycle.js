const sql = require('mssql');
const config = {
  server: 'DUONGVIETCUONG\\SQLEXPRESS',
  database: 'BIEUQUYET_CHP', 
  user: 'sa',
  password: '123456',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

(async () => {
  try {
    const pool = await sql.connect(config);
    
    console.log('=== Checking soft deleted data ===');
    
    // Check Users
    const users = await pool.request().query('SELECT COUNT(*) as count FROM Users WHERE IsDeleted = 1');
    console.log('Deleted Users:', users.recordset[0].count);
    
    // Check Votes  
    const votes = await pool.request().query('SELECT COUNT(*) as count FROM Votes WHERE IsDeleted = 1');
    console.log('Deleted Votes:', votes.recordset[0].count);
    
    // Check Drafts
    const drafts = await pool.request().query('SELECT COUNT(*) as count FROM Drafts WHERE IsDeleted = 1');
    console.log('Deleted Drafts:', drafts.recordset[0].count);
    
    // Check RecycleBin table exists
    try {
      const recycleBin = await pool.request().query('SELECT COUNT(*) as count FROM RecycleBin');
      console.log('RecycleBin records:', recycleBin.recordset[0].count);
      
      // Show some RecycleBin data
      const data = await pool.request().query('SELECT TOP 5 * FROM RecycleBin ORDER BY DeletedDate DESC');
      console.log('RecycleBin sample data:', data.recordset);
    } catch (err) {
      console.log('RecycleBin table error:', err.message);
    }
    
    await pool.close();
  } catch (err) {
    console.error('Database error:', err.message);
  }
})();
