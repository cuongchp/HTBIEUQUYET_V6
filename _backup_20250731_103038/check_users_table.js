const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'sa123456',
  server: 'localhost',
  database: 'BIEUQUYET_CHP',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function checkUsersTable() {
  try {
    console.log('🔌 Connecting to database...');
    const pool = await sql.connect(config);
    console.log('✅ Database connected');

    // Check table structure
    console.log('\n📊 Users table structure:');
    const structure = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columns:', structure.recordset);

    // Check sample data
    console.log('\n📝 Sample users data:');
    const sample = await pool.request().query('SELECT TOP 3 * FROM Users');
    console.log('Sample records:', sample.recordset);

    // Check if specific fields exist
    console.log('\n🔍 Checking field names...');
    const fieldCheck = await pool.request().query(`
      SELECT 
        CASE WHEN EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'UserID') THEN 'EXISTS' ELSE 'NOT EXISTS' END as UserID_Field,
        CASE WHEN EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'Id') THEN 'EXISTS' ELSE 'NOT EXISTS' END as Id_Field,
        CASE WHEN EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'IsActive') THEN 'EXISTS' ELSE 'NOT EXISTS' END as IsActive_Field,
        CASE WHEN EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'CreatedDate') THEN 'EXISTS' ELSE 'NOT EXISTS' END as CreatedDate_Field
    `);
    console.log('Field check:', fieldCheck.recordset[0]);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.close();
  }
}

checkUsersTable();
