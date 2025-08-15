const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Database configuration
const dbConfig = {
  user: 'sa',
  password: '123456',
  server: 'DUONGVIETCUONG\\SQLEXPRESS',
  database: 'BIEUQUYET_CHP',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
    enableArithAbort: true
  },
  port: 1433,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
  secret: 'evnchp-voting-system-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Database connection
let pool;

async function connectDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    pool = await sql.connect(dbConfig);
    app.locals.pool = pool;
    console.log('✅ Connected to SQL Server successfully');
    
    // Create tables without IsDeleted dependencies
    await createTables();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    return false;
  }
}

// Create tables - SAFE VERSION without IsDeleted dependencies
async function createTables() {
  try {
    console.log('📋 Creating/verifying tables...');
    const request = pool.request();

    // Users table - basic version first
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) UNIQUE NOT NULL,
        Password NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        Role NVARCHAR(20) DEFAULT 'User',
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME DEFAULT GETDATE()
      )
    `);

    // Try to add IsDeleted column if it doesn't exist (but don't fail if it doesn't work)
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'IsDeleted')
        ALTER TABLE Users ADD IsDeleted BIT DEFAULT 0
      `);
      console.log('✅ Users.IsDeleted column added/verified');
    } catch (columnError) {
      console.log('ℹ️ Users.IsDeleted column addition skipped');
    }

    // Votes table
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Votes' AND xtype='U')
      CREATE TABLE Votes (
        VoteID INT IDENTITY(1,1) PRIMARY KEY,
        VoteNumber NVARCHAR(50) UNIQUE NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Content NTEXT,
        AttachedFiles NTEXT,
        CreatedBy INT NOT NULL,
        CreatedDate DATETIME DEFAULT GETDATE(),
        AssigneeType NVARCHAR(20) DEFAULT 'All',
        Status NVARCHAR(20) DEFAULT 'Open'
      )
    `);

    // Try to add IsDeleted to Votes
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Votes' AND COLUMN_NAME = 'IsDeleted')
        ALTER TABLE Votes ADD IsDeleted BIT DEFAULT 0
      `);
      console.log('✅ Votes.IsDeleted column added/verified');
    } catch (columnError) {
      console.log('ℹ️ Votes.IsDeleted column addition skipped');
    }

    // VoteResults table
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VoteResults' AND xtype='U')
      CREATE TABLE VoteResults (
        VoteResultID INT IDENTITY(1,1) PRIMARY KEY,
        VoteID INT NOT NULL,
        UserID INT NOT NULL,
        Decision NVARCHAR(20) NOT NULL,
        Comments NTEXT,
        VoteDate DATETIME DEFAULT GETDATE()
      )
    `);

    // Drafts table
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Drafts' AND xtype='U')
      CREATE TABLE Drafts (
        DraftID INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(255) NOT NULL,
        Content NTEXT,
        AttachedFiles NTEXT,
        CreatedBy INT NOT NULL,
        CreatedDate DATETIME DEFAULT GETDATE(),
        Status NVARCHAR(20) DEFAULT 'Draft',
        CommentPeriod INT DEFAULT 7
      )
    `);

    // DraftComments table  
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DraftComments' AND xtype='U')
      CREATE TABLE DraftComments (
        CommentID INT IDENTITY(1,1) PRIMARY KEY,
        DraftID INT NOT NULL,
        UserID INT NOT NULL,
        Comment NTEXT NOT NULL,
        CommentDate DATETIME DEFAULT GETDATE()
      )
    `);

    // Create admin user if not exists
    const adminCheck = await request.query(`
      SELECT COUNT(*) as count FROM Users WHERE Username = 'admin'
    `);

    if (adminCheck.recordset[0].count === 0) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await request
        .input('username', sql.NVarChar, 'admin')
        .input('password', sql.NVarChar, hashedPassword)
        .input('fullName', sql.NVarChar, 'Administrator')
        .input('role', sql.NVarChar, 'Admin')
        .query(`
          INSERT INTO Users (Username, Password, FullName, Role, IsActive) 
          VALUES (@username, @password, @fullName, @role, 1)
        `);
      
      console.log('✅ Admin user created');
    }

    console.log('✅ All tables created successfully');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    throw err;
  }
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`🔐 Login attempt for: ${username}`);
    
    const request = pool.request();
    const result = await request
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM Users WHERE Username = @username AND IsActive = 1');

    if (result.recordset.length === 0) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.recordset[0];
    const isValidPassword = await bcrypt.compare(password, user.Password);

    if (!isValidPassword) {
      console.log(`❌ Invalid password for: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user permissions
    let permissions = [];
    try {
      const permResult = await request.input('UserID', sql.Int, user.UserID).query(`
        SELECT ModuleName FROM Permissions 
        WHERE UserID = @UserID AND CanAccess = 1
      `);
      permissions = permResult.recordset.map(p => p.ModuleName);
    } catch (permErr) {
      console.log('⚠️ Could not load permissions, using role-based access');
    }

    // Store user in session
    req.session.user = {
      UserID: user.UserID,
      Username: user.Username,
      FullName: user.FullName,
      Role: user.Role,
      Permissions: permissions
    };

    console.log(`✅ Login successful for: ${username}`);
    res.json({ 
      success: true, 
      user: req.session.user,
      message: 'Đăng nhập thành công' 
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

// Dashboard stats
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const request = pool.request();
    
    // Get statistics without IsDeleted dependencies
    const [openVotes, closedVotes, totalUsers] = await Promise.all([
      request.query("SELECT COUNT(*) as count FROM Votes WHERE Status = 'Open'"),
      request.query("SELECT COUNT(*) as count FROM Votes WHERE Status = 'Closed' AND YEAR(CreatedDate) = YEAR(GETDATE())"),
      request.query("SELECT COUNT(*) as count FROM Users WHERE IsActive = 1")
    ]);

    res.json({
      openVotes: openVotes.recordset[0].count,
      closedVotesThisYear: closedVotes.recordset[0].count,
      totalUsers: totalUsers.recordset[0].count
    });

  } catch (err) {
    console.error('❌ Stats error:', err);
    res.status(500).json({ error: 'Error getting statistics' });
  }
});

// Mount routes
app.use('/api/drafts', require('./routes/drafts'));
app.use('/api/votes', require('./routes/votes'));
app.use('/api/admin', require('./routes/admin_new'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV !== 'production' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  const dbConnected = await connectDatabase();
  
  if (!dbConnected) {
    console.error('❌ Cannot start server without database connection');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
    console.log('✨ EVNCHP Voting System is ready!');
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down server...');
  
  if (pool) {
    await pool.close();
    console.log('🔌 Database connection closed');
  }
  
  console.log('👋 Server stopped');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
