const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

class LoggingService {
  constructor() {
    this.logDir = './logs';
    this.ensureLogDirectory();
    this.setupLogger();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
      console.log(`✅ Created logs directory: ${this.logDir}`);
    }
  }

  setupLogger() {
    // Custom format for logs
    const customFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
        }
        
        if (stack) {
          log += `\nStack: ${stack}`;
        }
        
        return log;
      })
    );

    // Create logger instance
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      transports: [
        // Error logs
        new winston.transports.File({
          filename: path.join(this.logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        }),
        
        // Combined logs
        new winston.transports.File({
          filename: path.join(this.logDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 10,
          tailable: true
        }),
        
        // Security logs
        new winston.transports.File({
          filename: path.join(this.logDir, 'security.log'),
          level: 'warn',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true
        })
      ]
    });

    // Add console logging for development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  // Standard logging methods
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Specific logging methods for voting system
  logLogin(username, success, ip, userAgent) {
    const meta = {
      event: 'LOGIN_ATTEMPT',
      username,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    };

    if (success) {
      this.info(`Login successful for user: ${username}`, meta);
    } else {
      this.warn(`Login failed for user: ${username}`, meta);
    }
  }

  logVoteCreated(voteId, voteNumber, createdBy, assigneeType) {
    this.info(`Vote created: ${voteNumber}`, {
      event: 'VOTE_CREATED',
      voteId,
      voteNumber,
      createdBy,
      assigneeType,
      timestamp: new Date().toISOString()
    });
  }

  logVoteSubmitted(voteId, userId, choice) {
    this.info(`Vote submitted for vote ID: ${voteId}`, {
      event: 'VOTE_SUBMITTED',
      voteId,
      userId,
      choice,
      timestamp: new Date().toISOString()
    });
  }

  logFileUpload(filename, uploadedBy, size) {
    this.info(`File uploaded: ${filename}`, {
      event: 'FILE_UPLOADED',
      filename,
      uploadedBy,
      size,
      timestamp: new Date().toISOString()
    });
  }

  logSecurityEvent(event, details) {
    this.warn(`Security event: ${event}`, {
      event: 'SECURITY_EVENT',
      details,
      timestamp: new Date().toISOString()
    });
  }

  logDatabaseError(operation, error) {
    this.error(`Database error in ${operation}`, {
      event: 'DATABASE_ERROR',
      operation,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  logAPIError(endpoint, method, error, userId = null) {
    this.error(`API error at ${method} ${endpoint}`, {
      event: 'API_ERROR',
      endpoint,
      method,
      error: error.message,
      userId,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  // Performance logging
  logPerformance(operation, duration, details = {}) {
    const level = duration > 5000 ? 'warn' : 'info'; // Warn if > 5 seconds
    
    this.logger.log(level, `Performance: ${operation} took ${duration}ms`, {
      event: 'PERFORMANCE',
      operation,
      duration,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Express middleware for request logging
  requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Log request
      this.info(`${req.method} ${req.url}`, {
        event: 'HTTP_REQUEST',
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.session?.user?.UserID,
        timestamp: new Date().toISOString()
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(...args) {
        const duration = Date.now() - startTime;
        
        // Log response
        logger.info(`${req.method} ${req.url} - ${res.statusCode}`, {
          event: 'HTTP_RESPONSE',
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userId: req.session?.user?.UserID,
          timestamp: new Date().toISOString()
        });

        originalEnd.apply(this, args);
      };

      next();
    };
  }

  // Error handling middleware
  errorHandler() {
    return (error, req, res, next) => {
      // Log the error
      this.logAPIError(req.url, req.method, error, req.session?.user?.UserID);

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      res.status(error.status || 500).json({
        error: isDevelopment ? error.message : 'Lỗi hệ thống',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString(),
        requestId: req.id // If you have request ID middleware
      });
    };
  }

  // Cleanup old logs
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`Cleaned up old log file: ${file}`);
        }
      }
    } catch (error) {
      this.error('Error cleaning up old logs', { error: error.message });
    }
  }
}

// Create singleton instance
const logger = new LoggingService();

module.exports = logger;
