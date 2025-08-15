const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'DUONGVIETCUONG\\SQLEXPRESS',
  database: process.env.DB_NAME || 'BIEUQUYET_CHP',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true
  },
  port: parseInt(process.env.DB_PORT) || 1433
};

console.log('🔧 Testing database connection...');
console.log('📊 Config:', {
  server: config.server,
  database: config.database,
  user: config.user,
  port: config.port,
  encrypt: config.options.encrypt,
  trustServerCertificate: config.options.trustServerCertificate
});

async function testConnection() {
  try {
    console.log('🔌 Connecting to database...');
    const pool = await sql.connect(config);
    console.log('✅ Database connected successfully!');
    
    const result = await pool.request().query('SELECT COUNT(*) as UserCount FROM Users');
    console.log('👥 User count:', result.recordset[0].UserCount);
    
    await pool.close();
    console.log('✅ Database connection test completed!');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('🔍 Error details:', err);
  }
}

testConnection();
