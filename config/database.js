// Database configuration
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'BieuQuyetDB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Password123',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

module.exports = {
  config,
  connect: async function() {
    try {
      const pool = new sql.ConnectionPool(config);
      return await pool.connect();
    } catch (err) {
      console.error('Database connection error:', err);
      throw err;
    }
  }
};
