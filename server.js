const express = require('express');
const path = require('path');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

// Import dịch vụ tự động đóng phiếu
const { setDatabasePool, startVoteAutoCloseService, stopVoteAutoCloseService } = require('./services/voteAutoCloseService');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting Enhanced EVNCHP Voting System...');
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Enhanced session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'evnchp-voting-system-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Refresh session on each request
  name: 'evnchp.sid',
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    httpOnly: false, // Allow client access for debugging
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Less restrictive for localhost
  }
}));

// SQL Server configuration from environment
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

// Global connection pool
let pool;

// Initialize database connection
async function initializeDatabase() {
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server successfully');
    
    app.locals.pool = pool;
    
    // Truyền pool cho vote auto close service
    setDatabasePool(pool);
    
    await createTables();
    await insertSampleData();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  }
}

// Create tables if not exists (với IsDeleted column)
async function createTables() {
  try {
    const request = pool.request();
    
    // Users table with IsDeleted
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL UNIQUE,
        Password NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        Role NVARCHAR(20) NOT NULL DEFAULT 'User',
        CreatedDate DATETIME DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1,
        IsDeleted BIT DEFAULT 0
      )
    `);

    // Add IsDeleted column if it doesn't exist
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'IsDeleted')
      ALTER TABLE Users ADD IsDeleted BIT DEFAULT 0
    `);

    // Update existing records
    await request.query(`UPDATE Users SET IsDeleted = 0 WHERE IsDeleted IS NULL`);

    console.log('✅ Users table verified/created with IsDeleted column');

    // Permissions table
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Permissions' AND xtype='U')
      CREATE TABLE Permissions (
        PermissionID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT FOREIGN KEY REFERENCES Users(UserID),
        ModuleName NVARCHAR(50) NOT NULL,
        CanAccess BIT DEFAULT 0
      )
    `);

    // Votes table with IsDeleted
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Votes' AND xtype='U')
      CREATE TABLE Votes (
        VoteID INT IDENTITY(1,1) PRIMARY KEY,
        VoteNumber NVARCHAR(50) NOT NULL UNIQUE,
        Title NVARCHAR(255) NOT NULL,
        Content NTEXT NOT NULL,
        AttachedFiles NTEXT,
        CreatedBy INT FOREIGN KEY REFERENCES Users(UserID),
        CreatedDate DATETIME DEFAULT GETDATE(),
        Status NVARCHAR(20) DEFAULT 'Open',
        AssigneeType NVARCHAR(20) DEFAULT 'All',
        IsDeleted BIT DEFAULT 0
      )
    `);

    // Add IsDeleted to Votes if not exists
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Votes' AND COLUMN_NAME = 'IsDeleted')
      ALTER TABLE Votes ADD IsDeleted BIT DEFAULT 0
    `);

    await request.query(`UPDATE Votes SET IsDeleted = 0 WHERE IsDeleted IS NULL`);

    console.log('✅ All tables created/verified successfully');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  }
}

// Insert sample data
async function insertSampleData() {
  try {
    const request = pool.request();
    
    const adminExists = await request.query(`SELECT COUNT(*) as count FROM Users WHERE Username = 'admin' AND IsDeleted = 0`);
    
    if (adminExists.recordset[0].count === 0) {
      const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash('admin123', bcryptRounds);
      
      console.log('🔐 Creating admin user with enhanced security...');
      
      // Insert admin user with parameterized query
      await request
        .input('username', sql.NVarChar, 'admin')
        .input('password', sql.NVarChar, hashedPassword)
        .input('fullname', sql.NVarChar, 'Quản trị viên')
        .input('role', sql.NVarChar, 'Admin')
        .query(`
          INSERT INTO Users (Username, Password, FullName, Role, IsDeleted) 
          VALUES (@username, @password, @fullname, @role, 0)
        `);

      console.log('✅ Sample data inserted successfully');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (err) {
    console.error('❌ Error inserting sample data:', err.message);
  }
}

// Enhanced authentication middleware
let lastAuthTime = 0;
function requireAuth(req, res, next) {
  const now = Date.now();
  // Prevent spam - only log every 5 seconds
  if (now - lastAuthTime > 5000) {
    console.log('🔐 Authentication check for:', req.path);
    lastAuthTime = now;
  }
  
  if (!req.session.user) {
    console.log('❌ No valid session found');
    return res.status(401).json({ 
      error: 'Chưa đăng nhập',
      code: 'AUTHENTICATION_REQUIRED'
    });
  }
  
  console.log('✅ User authenticated:', req.session.user.FullName);
  next();
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + Buffer.from(file.originalname, 'latin1').toString('utf8'));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 300 * 1024 * 1024 }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add compatibility routes for different browsers
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Enhanced login endpoint with logging
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔑 Login attempt for user: ${username} from IP: ${req.ip}`);
    
    const request = pool.request();
    const result = await request
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM Users WHERE Username = @username AND IsActive = 1 AND IsDeleted = 0');
    
    if (result.recordset.length === 0) {
      console.log(`❌ Login failed: User not found - ${username}`);
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    const user = result.recordset[0];
    const isValidPassword = await bcrypt.compare(password, user.Password);
    
    if (!isValidPassword) {
      console.log(`❌ Login failed: Invalid password - ${username}`);
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }
    
    // Get user permissions
    const permResult = await request
      .input('UserID', sql.Int, user.UserID)
      .query('SELECT ModuleName, CanAccess FROM Permissions WHERE UserID = @UserID AND CanAccess = 1');
    
    req.session.user = {
      UserID: user.UserID,
      Username: user.Username,
      FullName: user.FullName,
      Role: user.Role,
      Permissions: permResult.recordset.map(p => p.ModuleName),
      loginTime: Date.now()
    };
    
    console.log(`✅ Login successful: ${username} (${user.Role})`);
    
    res.json({
      success: true,
      user: req.session.user
    });
    
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// Enhanced logout endpoint
app.post('/api/logout', (req, res) => {
  const username = req.session?.user?.Username;
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err.message);
      return res.status(500).json({ error: 'Lỗi đăng xuất' });
    }
    
    console.log(`👋 User logged out: ${username}`);
    res.json({ success: true });
  });
});

// Check session status without authentication requirement
app.get('/api/session-status', (req, res) => {
  if (req.session.user) {
    res.json({ 
      authenticated: true,
      user: {
        UserID: req.session.user.UserID,
        Username: req.session.user.Username,
        FullName: req.session.user.FullName,
        Role: req.session.user.Role,
        Permissions: req.session.user.Permissions
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Get current user
app.get('/api/user', requireAuth, (req, res) => {
  res.json({
    UserID: req.session.user.UserID,
    Username: req.session.user.Username,
    FullName: req.session.user.FullName,
    Role: req.session.user.Role,
    Permissions: req.session.user.Permissions
  });
});

// Dashboard statistics with error handling
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Dashboard stats API called for user:', req.session.user.UserID, req.session.user.Role);
    
    const request = pool.request();
    const userId = req.session.user.UserID;
    const userRole = req.session.user.Role;
    
    // Count pending votes that user hasn't voted on yet
    // For Admin: all open votes they haven't voted on
    // For User: open votes assigned to them that they haven't voted on
    let pendingVotesQuery;
    if (userRole === 'Admin') {
      pendingVotesQuery = `
        SELECT COUNT(*) as count FROM Votes v
        WHERE v.Status = 'Open' 
        AND v.IsDeleted = 0
        AND NOT EXISTS (
          SELECT 1 FROM VoteResults vr 
          WHERE vr.VoteID = v.VoteID AND vr.UserID = @userId
        )
      `;
    } else {
      pendingVotesQuery = `
        SELECT COUNT(*) as count FROM Votes v
        WHERE v.Status = 'Open' 
        AND v.IsDeleted = 0
        AND (
          v.AssigneeType = 'All' 
          OR EXISTS (
            SELECT 1 FROM VoteAssignees va 
            WHERE va.VoteID = v.VoteID AND va.UserID = @userId
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM VoteResults vr 
          WHERE vr.VoteID = v.VoteID AND vr.UserID = @userId
        )
      `;
    }
    
    console.log('📝 Pending votes query for', userRole + ':', pendingVotesQuery);
    const pendingVotesRequest = pool.request();
    pendingVotesRequest.input('userId', userId);
    const pendingVotes = await pendingVotesRequest.query(pendingVotesQuery);
    console.log('✅ Pending votes count:', pendingVotes.recordset[0].count);
    
    const completedVotes = await request.query(`
      SELECT COUNT(*) as count FROM Votes 
      WHERE Status = 'Closed' AND IsDeleted = 0 AND YEAR(CreatedDate) = YEAR(GETDATE())
    `);
    
    // Count drafts that user needs to comment on
    // For Admin: all active drafts, for User: drafts assigned to them that they haven't commented on yet
    let draftCommentsQuery;
    if (userRole === 'Admin') {
      draftCommentsQuery = `
        SELECT COUNT(*) as count FROM Drafts d 
        WHERE d.Status = 'Active' 
        AND d.IsDeleted = 0
        AND NOT EXISTS (
          SELECT 1 FROM DraftComments dc 
          WHERE dc.DraftID = d.DraftID AND dc.UserID = @userId
        )
      `;
    } else {
      draftCommentsQuery = `
        SELECT COUNT(*) as count FROM Drafts d 
        WHERE d.Status = 'Active' 
        AND d.IsDeleted = 0
        AND (
          d.ViewerType = 'All' 
          OR EXISTS (
            SELECT 1 FROM DraftPermissions dp 
            WHERE dp.DraftID = d.DraftID AND dp.UserID = @userId
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM DraftComments dc 
          WHERE dc.DraftID = d.DraftID AND dc.UserID = @userId
        )
      `;
    }
    
    const pendingCommentsRequest = pool.request();
    pendingCommentsRequest.input('userId', userId);
    const pendingComments = await pendingCommentsRequest.query(draftCommentsQuery);
    
    res.json({
      pendingVotes: pendingVotes.recordset[0].count,
      completedVotes: completedVotes.recordset[0].count,
      pendingComments: pendingComments.recordset[0].count
    });
    
  } catch (err) {
    console.error('❌ Dashboard stats error:', err.message);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// Get users for assignment
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const request = pool.request();
    const result = await request.query(`
      SELECT UserID, Username, FullName, Role
      FROM Users
      WHERE IsActive = 1 AND IsDeleted = 0
      ORDER BY FullName
    `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Get users error:', err.message);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// Enhanced ping endpoint
app.get('/api/ping', (req, res) => {
  console.log('📡 Ping endpoint called');
  res.json({ 
    success: true, 
    message: 'Enhanced EVNCHP Voting System is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0-secure',
    features: ['enhanced-auth', 'secure-sessions', 'input-validation', 'logging']
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    if (pool) {
      await pool.request().query('SELECT 1 as test');
      res.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Database pool not available');
    }
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

// Load existing routes with error handling
console.log('📂 Loading route modules...');

try {
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', requireAuth, adminRoutes);
  console.log('✅ Admin routes loaded');
} catch (err) {
  console.log('⚠️ Admin routes not loaded:', err.message);
}

try {
  const votesRoutes = require('./routes/votes');
  app.use('/api/votes', requireAuth, votesRoutes);
  console.log('✅ Votes routes loaded');
} catch (err) {
  console.log('⚠️ Votes routes not loaded:', err.message);
}

try {
  const draftsRoutes = require('./routes/drafts');
  app.use('/api/drafts', requireAuth, draftsRoutes);
  console.log('✅ Drafts routes loaded');
} catch (err) {
  console.log('⚠️ Drafts routes not loaded:', err.message);
}

try {
  const recycleBinRoutes = require('./routes/recycleBin');
  app.use('/api/recycle-bin', requireAuth, recycleBinRoutes);
  console.log('✅ Recycle bin routes loaded');
} catch (err) {
  console.log('⚠️ Recycle bin routes not loaded:', err.message);
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err.message);
  res.status(500).json({
    error: 'Lỗi hệ thống',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message })
  });
});

// Handle favicon.ico to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Simple 404 handler
app.use((req, res) => {
  console.log('⚠️ 404 Not Found:', req.path);
  res.status(404).json({ error: 'Không tìm thấy trang' });
});

// Start server
app.listen(PORT, async () => {
  console.log('');
  console.log('🎉 ===============================================');
  console.log('🎯   HỆ THỐNG BIỂU QUYẾT EVNCHP - ENHANCED    ');  
  console.log('🎉 ===============================================');
  console.log('');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Enhanced`);
  console.log(`📝 Test ping: http://localhost:${PORT}/api/ping`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('🔑 Default login: admin / admin123');
  console.log('');
  
  await initializeDatabase();
  
  // Khởi động dịch vụ tự động đóng phiếu
  console.log('⏰ Khởi động dịch vụ tự động đóng phiếu biểu quyết...');
  startVoteAutoCloseService();
  
  console.log('✅ Server started successfully!');
  console.log('✅ Ready to accept connections');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  stopVoteAutoCloseService();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  stopVoteAutoCloseService();
  process.exit(0);
});

module.exports = app;
