const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
require('dotenv').config();

// Import services and middleware
const databaseService = require('./services/databaseService');
const fileUploadService = require('./services/fileUploadService');
const logger = require('./services/loggingService');
const { requireAuth, requireRole, loginService, securityHeaders } = require('./middleware/auth');
const { validateLogin, validateCreateUser } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP
  message: {
    error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
});

app.use(limiter);
app.use('/api/login', loginLimiter);

// Basic middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true, // Configure properly for production
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(securityHeaders);

// Request logging
app.use(logger.requestLogger());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Enhanced session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'evnchp.sid', // Change default session name
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF protection
  }
}));

// Initialize database connection
async function initializeDatabase() {
  try {
    await databaseService.connect();
    
    // Store database service in app locals for routes
    app.locals.db = databaseService;
    
    logger.info('Database initialized successfully');
  } catch (err) {
    logger.error('Database initialization failed', { error: err.message });
    process.exit(1); // Exit if can't connect to database
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Enhanced login endpoint
app.post('/api/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const startTime = Date.now();
    
    logger.info(`Login attempt for user: ${username}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Authenticate user
    const sessionUser = await loginService.authenticateUser(username, password);
    
    // Store in session
    req.session.user = sessionUser;
    
    // Log successful login
    logger.logLogin(username, true, req.ip, req.get('User-Agent'));
    logger.logPerformance('login', Date.now() - startTime, { username });
    
    res.json({
      success: true,
      user: {
        UserID: sessionUser.UserID,
        Username: sessionUser.Username,
        FullName: sessionUser.FullName,
        Role: sessionUser.Role,
        Permissions: sessionUser.Permissions
      }
    });
    
  } catch (err) {
    logger.logLogin(req.body.username, false, req.ip, req.get('User-Agent'));
    logger.error('Login failed', { 
      username: req.body.username,
      error: err.message,
      ip: req.ip
    });
    
    res.status(401).json({ 
      error: err.message,
      code: 'LOGIN_FAILED'
    });
  }
});

// Enhanced logout endpoint
app.post('/api/logout', requireAuth, (req, res) => {
  const username = req.session.user?.Username;
  
  req.session.destroy((err) => {
    if (err) {
      logger.error('Logout error', { 
        username,
        error: err.message 
      });
      return res.status(500).json({ 
        error: 'Lỗi đăng xuất',
        code: 'LOGOUT_ERROR'
      });
    }
    
    logger.info(`User logged out: ${username}`);
    res.json({ success: true });
  });
});

// Get current user info
app.get('/api/user', requireAuth, (req, res) => {
  const user = req.session.user;
  res.json({
    UserID: user.UserID,
    Username: user.Username,
    FullName: user.FullName,
    Role: user.Role,
    Permissions: user.Permissions
  });
});

// Dashboard statistics
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const startTime = Date.now();
    const db = req.app.locals.db;
    const pool = db.getPool();
    const request = pool.request();
    
    // Get statistics
    const [pendingVotes, completedVotes] = await Promise.all([
      request.query("SELECT COUNT(*) as count FROM Votes WHERE Status = 'Open' AND IsDeleted = 0"),
      request.query(`
        SELECT COUNT(*) as count FROM Votes 
        WHERE Status = 'Closed' AND IsDeleted = 0 AND YEAR(CreatedDate) = YEAR(GETDATE())
      `)
    ]);
    
    const stats = {
      pendingVotes: pendingVotes.recordset[0].count,
      completedVotes: completedVotes.recordset[0].count
    };
    
    logger.logPerformance('dashboard_stats', Date.now() - startTime);
    
    res.json(stats);
    
  } catch (err) {
    logger.logAPIError('/api/dashboard/stats', 'GET', err, req.session.user?.UserID);
    res.status(500).json({ 
      error: 'Lỗi lấy thống kê',
      code: 'STATS_ERROR'
    });
  }
});

// Get users for assignment
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = await db.getAllUsers({ isActive: true });
    
    // Remove sensitive data
    const safeUsers = users.map(user => ({
      UserID: user.UserID,
      Username: user.Username,
      FullName: user.FullName,
      Role: user.Role
    }));
    
    res.json(safeUsers);
  } catch (err) {
    logger.logAPIError('/api/users', 'GET', err, req.session.user?.UserID);
    res.status(500).json({ 
      error: 'Lỗi lấy danh sách người dùng',
      code: 'USERS_FETCH_ERROR'
    });
  }
});

// Enhanced ping endpoint with system info
app.get('/api/ping', (req, res) => {
  const systemInfo = {
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  res.json(systemInfo);
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connectivity
    const db = req.app.locals.db;
    const pool = db.getPool();
    await pool.request().query('SELECT 1 as test');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        session: 'active',
        logging: 'active'
      }
    });
  } catch (err) {
    logger.error('Health check failed', { error: err.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// Import and use route modules with error handling
let adminRoutes, votesRoutes, draftsRoutes, recycleBinRoutes;

try {
  adminRoutes = require('./routes/admin');
  app.use('/api/admin', requireAuth, requireRole('Admin'), adminRoutes);
  console.log('✅ Admin routes loaded');
} catch (err) {
  console.warn('⚠️ Admin routes not loaded:', err.message);
}

try {
  votesRoutes = require('./routes/votes');
  app.use('/api/votes', requireAuth, votesRoutes);
  console.log('✅ Votes routes loaded');
} catch (err) {
  console.warn('⚠️ Votes routes not loaded:', err.message);
}

try {
  draftsRoutes = require('./routes/drafts');
  app.use('/api/drafts', requireAuth, draftsRoutes);
  console.log('✅ Drafts routes loaded');
} catch (err) {
  console.warn('⚠️ Drafts routes not loaded:', err.message);
}

try {
  recycleBinRoutes = require('./routes/recycleBin');
  app.use('/api/recycle-bin', requireAuth, recycleBinRoutes);
  console.log('✅ Recycle bin routes loaded');
} catch (err) {
  console.warn('⚠️ Recycle bin routes not loaded:', err.message);
}

// File upload error handling
app.use(fileUploadService.handleMulterError.bind(fileUploadService));

// Global error handler
app.use(logger.errorHandler());

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Không tìm thấy trang',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await databaseService.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', { error: err.message });
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security: Enhanced`);
      console.log(`📝 Logging: Active`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      
      logger.info(`Server started successfully on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

startServer();

module.exports = app;
