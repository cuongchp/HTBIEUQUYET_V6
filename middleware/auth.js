const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const databaseService = require('../services/databaseService');
require('dotenv').config();

// Enhanced authentication middleware
const requireAuth = (req, res, next) => {
  console.log('🔐 Authentication check');
  console.log('Session exists:', !!req.session);
  console.log('User in session:', !!req.session?.user);
  
  if (!req.session || !req.session.user) {
    console.log('❌ No valid session found');
    return res.status(401).json({ 
      error: 'Chưa đăng nhập',
      code: 'AUTHENTICATION_REQUIRED',
      redirect: '/login'
    });
  }
  
  // Check if session is expired (additional security)
  const sessionAge = Date.now() - (req.session.user.loginTime || 0);
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (sessionAge > maxAge) {
    req.session.destroy();
    return res.status(401).json({ 
      error: 'Phiên đăng nhập đã hết hạn',
      code: 'SESSION_EXPIRED',
      redirect: '/login'
    });
  }
  
  console.log('✅ User authenticated:', req.session.user.FullName);
  next();
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ 
        error: 'Chưa đăng nhập',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    const userRole = req.session.user.Role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ Access denied. User role: ${userRole}, Required: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ 
        error: 'Không có quyền truy cập',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }
    
    console.log(`✅ Role authorized: ${userRole}`);
    next();
  };
};

// Permission-based access control
const requirePermission = (moduleName) => {
  return async (req, res, next) => {
    try {
      if (!req.session?.user) {
        return res.status(401).json({ 
          error: 'Chưa đăng nhập',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }
      
      const userId = req.session.user.UserID;
      const userRole = req.session.user.Role;
      
      // Admin has all permissions
      if (userRole === 'Admin') {
        console.log('✅ Admin access granted');
        return next();
      }
      
      // Check specific permission
      const permissions = await databaseService.getUserPermissions(userId);
      
      if (!permissions.includes(moduleName)) {
        console.log(`❌ Permission denied for module: ${moduleName}`);
        return res.status(403).json({ 
          error: `Không có quyền truy cập module ${moduleName}`,
          code: 'MODULE_ACCESS_DENIED',
          module: moduleName
        });
      }
      
      console.log(`✅ Permission granted for module: ${moduleName}`);
      next();
    } catch (error) {
      console.error('❌ Permission check error:', error);
      res.status(500).json({ 
        error: 'Lỗi kiểm tra quyền',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

// Enhanced login service
const loginService = {
  async authenticateUser(username, password) {
    try {
      // Get user from database
      const user = await databaseService.getUserByUsername(username);
      
      if (!user) {
        throw new Error('INVALID_CREDENTIALS');
      }
      
      if (!user.IsActive) {
        throw new Error('ACCOUNT_DISABLED');
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.Password);
      
      if (!isValidPassword) {
        throw new Error('INVALID_CREDENTIALS');
      }
      
      // Get user permissions
      const permissions = await databaseService.getUserPermissions(user.UserID);
      
      // Create session data
      const sessionUser = {
        UserID: user.UserID,
        Username: user.Username,
        FullName: user.FullName,
        Role: user.Role,
        Permissions: permissions,
        loginTime: Date.now()
      };
      
      console.log('✅ User authenticated successfully:', user.Username);
      return sessionUser;
      
    } catch (error) {
      console.error('❌ Authentication error:', error.message);
      
      // Map internal errors to user-friendly messages
      switch (error.message) {
        case 'INVALID_CREDENTIALS':
          throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
        case 'ACCOUNT_DISABLED':
          throw new Error('Tài khoản đã bị vô hiệu hóa');
        default:
          throw new Error('Lỗi hệ thống đăng nhập');
      }
    }
  },

  async hashPassword(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, rounds);
  },

  generateSessionId() {
    return require('crypto').randomBytes(32).toString('hex');
  }
};

// Rate limiting per user
const userRateLimit = new Map();

const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const userId = req.session?.user?.UserID || req.ip;
    const now = Date.now();
    
    if (!userRateLimit.has(userId)) {
      userRateLimit.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userLimit = userRateLimit.get(userId);
    
    if (now > userLimit.resetTime) {
      userRateLimit.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        error: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: userLimit.resetTime
      });
    }
    
    userLimit.count++;
    next();
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // CSRF protection header
  res.setHeader('X-CSRF-Token', req.sessionID);
  
  // Cache control for sensitive pages
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  
  next();
};

// Log security events
const logSecurityEvent = (event, req, details = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.session?.user?.UserID,
    username: req.session?.user?.Username,
    ...details
  };
  
  console.log('🔒 Security Event:', JSON.stringify(logData));
  
  // In production, send to proper logging service
  // logger.security(logData);
};

module.exports = {
  requireAuth,
  requireRole,
  requirePermission,
  loginService,
  rateLimitByUser,
  securityHeaders,
  logSecurityEvent
};
