const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

class FileUploadService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB default
    this.allowedTypes = (process.env.ALLOWED_FILE_TYPES || '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png').split(',');
    
    this.initializeDirectories();
  }

  initializeDirectories() {
    const dirs = [
      this.uploadDir,
      path.join(this.uploadDir, 'votes'),
      path.join(this.uploadDir, 'drafts'),
      path.join(this.uploadDir, 'documents'),
      path.join(this.uploadDir, 'signatures')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    });
  }

  // Secure filename generation
  generateSecureFilename(originalname) {
    const ext = path.extname(originalname).toLowerCase();
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    
    // Sanitize original filename
    const baseName = path.basename(originalname, ext)
      .replace(/[^a-zA-Z0-9_\-\s]/g, '') // Remove special chars
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
    
    return `${timestamp}-${randomString}-${baseName}${ext}`;
  }

  // File type validation
  validateFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.allowedTypes.includes(ext);
  }

  // MIME type validation (additional security)
  validateMimeType(file) {
    const allowedMimes = {
      '.pdf': ['application/pdf'],
      '.doc': ['application/msword'],
      '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      '.xls': ['application/vnd.ms-excel'],
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png']
    };

    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimesForExt = allowedMimes[ext];
    
    if (!allowedMimesForExt) {
      return false;
    }

    return allowedMimesForExt.includes(file.mimetype);
  }

  // Create storage configuration for different upload types
  createStorage(subdir = '') {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(this.uploadDir, subdir);
        
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
      },
      
      filename: (req, file, cb) => {
        try {
          // Validate file type
          if (!this.validateFileType(file.originalname)) {
            return cb(new Error(`Loại file không được phép: ${path.extname(file.originalname)}`));
          }

          // Validate MIME type
          if (!this.validateMimeType(file)) {
            return cb(new Error(`MIME type không hợp lệ: ${file.mimetype}`));
          }

          const secureFilename = this.generateSecureFilename(file.originalname);
          
          // Store original filename in file object for reference
          file.originalFilename = file.originalname;
          file.secureFilename = secureFilename;
          
          cb(null, secureFilename);
        } catch (error) {
          cb(error);
        }
      }
    });
  }

  // File filter function
  createFileFilter() {
    return (req, file, cb) => {
      // Check file size in filter as well
      if (file.size && file.size > this.maxFileSize) {
        return cb(new Error(`File quá lớn. Tối đa ${this.maxFileSize / 1024 / 1024}MB`));
      }

      // Validate filename length
      if (file.originalname.length > 255) {
        return cb(new Error('Tên file quá dài (tối đa 255 ký tự)'));
      }

      // Check for null bytes (security)
      if (file.originalname.includes('\0')) {
        return cb(new Error('Tên file không hợp lệ'));
      }

      cb(null, true);
    };
  }

  // Create multer instance for different upload types
  createUploader(type = 'general', maxFiles = 10) {
    const storage = this.createStorage(type);
    const fileFilter = this.createFileFilter();

    return multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: maxFiles,
        fieldSize: 10 * 1024 * 1024, // 10MB for form fields
      }
    });
  }

  // Specific uploaders for different modules
  getVoteUploader() {
    return this.createUploader('votes', 5);
  }

  getDraftUploader() {
    return this.createUploader('drafts', 5);
  }

  getDocumentUploader() {
    return this.createUploader('documents', 1);
  }

  getSignatureUploader() {
    return this.createUploader('signatures', 1);
  }

  // File validation middleware
  validateUploadedFiles(req, res, next) {
    if (!req.files || req.files.length === 0) {
      return next(); // No files to validate
    }

    const errors = [];

    req.files.forEach((file, index) => {
      // Additional server-side validation
      if (!fs.existsSync(file.path)) {
        errors.push(`File ${index + 1}: Upload failed`);
        return;
      }

      // Check actual file size
      const stats = fs.statSync(file.path);
      if (stats.size > this.maxFileSize) {
        fs.unlinkSync(file.path); // Delete oversized file
        errors.push(`File ${index + 1}: Kích thước vượt quá giới hạn`);
        return;
      }

      // Store file info for database
      file.uploadInfo = {
        originalName: file.originalFilename || file.originalname,
        secureName: file.filename,
        size: stats.size,
        uploadedAt: new Date(),
        uploadedBy: req.session?.user?.UserID
      };
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Lỗi upload file',
        details: errors
      });
    }

    next();
  }

  // File cleanup utilities
  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error deleting file ${filePath}:`, error);
      return false;
    }
  }

  async deleteFilesByPattern(directory, pattern) {
    try {
      const files = fs.readdirSync(directory);
      const regex = new RegExp(pattern);
      
      const deletedFiles = [];
      for (const file of files) {
        if (regex.test(file)) {
          const filePath = path.join(directory, file);
          if (await this.deleteFile(filePath)) {
            deletedFiles.push(file);
          }
        }
      }
      
      return deletedFiles;
    } catch (error) {
      console.error('❌ Error deleting files by pattern:', error);
      return [];
    }
  }

  // Get file info
  getFileInfo(filename, subdir = '') {
    const filePath = path.join(this.uploadDir, subdir, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    return {
      filename,
      path: filePath,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  }

  // Error handler for multer
  handleMulterError(error, req, res, next) {
    if (error instanceof multer.MulterError) {
      switch (error.code) {
        case 'LIMIT_FILE_SIZE':
          return res.status(400).json({
            error: 'File quá lớn',
            maxSize: `${this.maxFileSize / 1024 / 1024}MB`
          });
        case 'LIMIT_FILE_COUNT':
          return res.status(400).json({
            error: 'Quá nhiều file',
            message: 'Vượt quá số lượng file cho phép'
          });
        case 'LIMIT_UNEXPECTED_FILE':
          return res.status(400).json({
            error: 'File không mong đợi',
            message: 'Field name không đúng'
          });
        default:
          return res.status(400).json({
            error: 'Lỗi upload file',
            details: error.message
          });
      }
    }

    if (error.message.includes('File type')) {
      return res.status(400).json({
        error: 'Loại file không được phép',
        allowedTypes: this.allowedTypes
      });
    }

    next(error);
  }
}

module.exports = new FileUploadService();
