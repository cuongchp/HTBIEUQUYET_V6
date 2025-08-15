// Application configuration
module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'your_secret_key_here',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: process.env.MAX_FILE_SIZE || 10485760, // 10MB
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,docx,xlsx,pptx,jpg,jpeg,png').split(',')
};
