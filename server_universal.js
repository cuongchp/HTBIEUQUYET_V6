// Universal Browser Compatibility Server
// Supports: Chrome, Edge, Firefox, Safari, Opera
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sql = require('mssql');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS for universal browser support
app.use(cors({
  origin: function(origin, callback) {
    // Allow any origin in development
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Enhanced middleware for browser compatibility
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Universal session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'evnchp-voting-system-secret-universal',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  name: 'evnchp.sid',
  cookie: { 
    secure: false, // Works on HTTP and HTTPS
    httpOnly: false, // Allow client-side access for debugging
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: false // Most permissive for cross-browser compatibility
  }
}));

// Database configuration
const config = {
  server: process.env.DB_SERVER || 'DUONGVIETCUONG\\SQLEXPRESS',
  database: process.env.DB_NAME || 'BIEUQUYET_CHP',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

// Enhanced authentication middleware with debug
function requireAuth(req, res, next) {
  console.log('🔐 Auth check:', {
    path: req.path,
    session: !!req.session,
    user: !!req.session?.user,
    sessionId: req.sessionID
  });
  
  if (!req.session.user) {
    console.log('❌ No session user found');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  console.log('✅ User authenticated:', req.session.user.FullName);
  next();
}

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    browser: getBrowserInfo(req.get('User-Agent'))
  });
});

// Browser detection utility
function getBrowserInfo(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Other';
}

// Login endpoint with enhanced browser support
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`🔐 Login attempt: ${username} from ${getBrowserInfo(req.get('User-Agent'))}`);
    
    const request = pool.request();
    request.input('username', sql.NVarChar, username);
    
    const result = await request.query(`
      SELECT UserID, Username, FullName, Password, Role 
      FROM Users 
      WHERE Username = @username AND (IsDeleted = 0 OR IsDeleted IS NULL)
    `);
    
    if (result.recordset.length === 0) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.recordset[0];
    const isValidPassword = await bcrypt.compare(password, user.Password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get user permissions
    const permRequest = pool.request();
    permRequest.input('userId', sql.Int, user.UserID);
    
    const permResult = await permRequest.query(`
      SELECT DISTINCT p.PermissionName
      FROM UserPermissions up
      INNER JOIN Permissions p ON up.PermissionID = p.PermissionID
      WHERE up.UserID = @userId
    `);
    
    const permissions = permResult.recordset.map(p => p.PermissionName);
    
    // Set session with comprehensive user data
    req.session.user = {
      UserID: user.UserID,
      Username: user.Username,
      FullName: user.FullName,
      Role: user.Role,
      Permissions: permissions,
      loginTime: Date.now(),
      browser: getBrowserInfo(req.get('User-Agent'))
    };
    
    // Force session save for all browsers
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session creation failed' });
      }
      
      console.log('✅ Login successful:', user.FullName);
      res.json({ 
        success: true, 
        user: {
          UserID: user.UserID,
          Username: user.Username,
          FullName: user.FullName,
          Role: user.Role,
          Permissions: permissions
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Current user endpoint
app.get('/api/user', requireAuth, (req, res) => {
  res.json({
    UserID: req.session.user.UserID,
    Username: req.session.user.Username,
    FullName: req.session.user.FullName,
    Role: req.session.user.Role,
    Permissions: req.session.user.Permissions,
    browser: req.session.user.browser
  });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const username = req.session?.user?.Username || 'Unknown';
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    console.log('👋 User logged out:', username);
    res.clearCookie('evnchp.sid');
    res.json({ success: true });
  });
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    console.log('📊 Dashboard stats for:', req.session.user.FullName);
    
    const request = pool.request();
    const userId = req.session.user.UserID;
    request.input('userId', sql.Int, userId);
    
    // Get pending votes
    const pendingQuery = req.session.user.Role === 'Admin' 
      ? `SELECT COUNT(*) as count FROM Votes v WHERE v.Status = 'Open' AND (v.IsDeleted = 0 OR v.IsDeleted IS NULL)`
      : `SELECT COUNT(*) as count FROM Votes v
         WHERE v.Status = 'Open' AND (v.IsDeleted = 0 OR v.IsDeleted IS NULL)
         AND (v.AssigneeType = 'All' OR EXISTS (
           SELECT 1 FROM VoteAssignees va WHERE va.VoteID = v.VoteID AND va.UserID = @userId
         )) AND NOT EXISTS (
           SELECT 1 FROM VoteResults vr WHERE vr.VoteID = v.VoteID AND vr.UserID = @userId
         )`;
    
    const pendingResult = await request.query(pendingQuery);
    const pendingVotes = pendingResult.recordset[0].count;
    
    // Get drafts count
    const draftsRequest = pool.request();
    draftsRequest.input('userId', sql.Int, userId);
    
    const draftsResult = await draftsRequest.query(`
      SELECT COUNT(*) as count FROM Drafts 
      WHERE (IsDeleted = 0 OR IsDeleted IS NULL) AND Status = 'Active'
    `);
    const activeDrafts = draftsResult.recordset[0].count;
    
    res.json({
      pendingVotes,
      activeDrafts,
      totalUsers: req.session.user.Role === 'Admin' ? 16 : null
    });
    
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

// Load additional routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/votes', require('./routes/votes'));
app.use('/api/drafts', require('./routes/drafts'));
app.use('/api/recycle-bin', require('./routes/recycleBin'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    browser: getBrowserInfo(req.get('User-Agent')),
    details: process.env.NODE_ENV !== 'production' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    browser: getBrowserInfo(req.get('User-Agent'))
  });
});

// Database connection and server startup
async function startServer() {
  try {
    console.log('🚀 Starting Universal Browser Compatible Server...');
    console.log('🌐 Browsers: Chrome, Edge, Firefox, Safari, Opera');
    
    // Connect to database
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
🎉 ===============================================
🎯   HỆ THỐNG BIỂU QUYẾT EVNCHP - UNIVERSAL
🎉 ===============================================

🌐 URL: http://localhost:${PORT}
🔧 Universal Browser Support: ✅
📱 Mobile Compatible: ✅
🔒 Session Management: Enhanced
🚀 Performance: Optimized

🔑 Default login: admin / admin123

✅ Server ready for all browsers!
      `);
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
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

startServer();

module.exports = app;
