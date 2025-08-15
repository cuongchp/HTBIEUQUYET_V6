const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dữ liệu không hợp lệ',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Sanitization helpers
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/[<>]/g, ''); // Basic XSS prevention
};

// User validation rules
const validateLogin = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Tên đăng nhập phải từ 3-50 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới')
    .customSanitizer(sanitizeInput),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Mật khẩu phải từ 6-100 ký tự'),
  
  handleValidationErrors
];

const validateCreateUser = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Tên đăng nhập phải từ 3-50 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới')
    .customSanitizer(sanitizeInput),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Mật khẩu phải từ 6-100 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự')
    .customSanitizer(sanitizeInput),
  
  body('role')
    .optional()
    .isIn(['Admin', 'User'])
    .withMessage('Role chỉ có thể là Admin hoặc User'),
  
  handleValidationErrors
];

// Vote validation rules
const validateCreateVote = [
  body('voteNumber')
    .isLength({ min: 1, max: 20 })
    .withMessage('Số phiếu không được để trống và tối đa 20 ký tự')
    .matches(/^[0-9]+$/)
    .withMessage('Số phiếu chỉ chứa số')
    .customSanitizer(sanitizeInput),
  
  body('title')
    .isLength({ min: 5, max: 255 })
    .withMessage('Tiêu đề phải từ 5-255 ký tự')
    .customSanitizer(sanitizeInput),
  
  body('content')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Nội dung phải từ 10-10000 ký tự')
    .customSanitizer(sanitizeInput),
  
  body('assigneeType')
    .isIn(['All', 'specific'])
    .withMessage('Loại chỉ định phải là All hoặc specific'),
  
  body('assignees')
    .optional()
    .custom((value, { req }) => {
      if (req.body.assigneeType === 'specific') {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          throw new Error('Phải chọn ít nhất 1 người khi chỉ định cụ thể');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateVoteSubmission = [
  body('choice')
    .isIn(['agree', 'disagree', 'other'])
    .withMessage('Lựa chọn phải là agree, disagree hoặc other'),
  
  body('reason')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Lý do không được quá 1000 ký tự')
    .customSanitizer(sanitizeInput),
  
  body('reason')
    .custom((value, { req }) => {
      if (req.body.choice === 'disagree' || req.body.choice === 'other') {
        if (!value || value.trim().length < 5) {
          throw new Error('Phải nhập lý do khi chọn Không đồng ý hoặc Ý kiến khác (tối thiểu 5 ký tự)');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

// Draft validation rules
const validateCreateDraft = [
  body('title')
    .isLength({ min: 5, max: 255 })
    .withMessage('Tiêu đề dự thảo phải từ 5-255 ký tự')
    .customSanitizer(sanitizeInput),
  
  body('content')
    .isLength({ min: 10, max: 50000 })
    .withMessage('Nội dung dự thảo phải từ 10-50000 ký tự')
    .customSanitizer(sanitizeInput),
  
  body('commentPeriod')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Thời gian góp ý phải từ 1-30 ngày'),
  
  handleValidationErrors
];

// Parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID phải là số nguyên dương'),
  
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1-100'),
  
  handleValidationErrors
];

// File validation
const validateFileUpload = (allowedTypes, maxSize) => {
  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(); // File upload is optional
    }
    
    const errors = [];
    
    req.files.forEach((file, index) => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: Kích thước vượt quá ${maxSize / 1024 / 1024}MB`);
      }
      
      // Check file type
      const ext = require('path').extname(file.originalname).toLowerCase();
      if (!allowedTypes.includes(ext)) {
        errors.push(`File ${index + 1}: Loại file ${ext} không được phép`);
      }
      
      // Check filename
      if (file.originalname.length > 255) {
        errors.push(`File ${index + 1}: Tên file quá dài`);
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'File không hợp lệ',
        details: errors
      });
    }
    
    next();
  };
};

// SQL Injection prevention
const sanitizeForSQL = (value) => {
  if (typeof value !== 'string') return value;
  // Remove potential SQL injection patterns
  return value.replace(/[';--]/g, '');
};

module.exports = {
  validateLogin,
  validateCreateUser,
  validateCreateVote,
  validateVoteSubmission,
  validateCreateDraft,
  validateId,
  validatePagination,
  validateFileUpload,
  handleValidationErrors,
  sanitizeInput,
  sanitizeForSQL
};
