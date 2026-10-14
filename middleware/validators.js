const { query, param, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Middleware to check for validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new AppError(errorMessages.join('. '), 400));
  }
  next();
};

const validateFilters = (req, res, next) => {
  const allowed = new Set(['page', 'value', 'xclude', 'st', 't', 'd', 'm', 's', 'rawi']);
  for (const [key, value] of Object.entries(req.query)) {
    if (!allowed.has(key)) return next(new AppError('Unknown search parameter', 400));
    if (['d', 'm', 's', 'rawi'].includes(key)) {
      const values = Array.isArray(value) ? value : [value];
      if (values.length > 20 || values.some(v => typeof v !== 'string' || !/^\d+(?:-\d+)*$/.test(v) || v.length > 80)) return next(new AppError('Invalid filter IDs', 400));
      if (key === 'd' && values.some(v => !['0', '1', '2', '3', '4'].includes(v))) return next(new AppError('Invalid degree filter', 400));
      req.query[key] = values;
    } else if (typeof value !== 'string') return next(new AppError('Expected scalar parameter', 400));
  }
  if (req.query.st && !['w', 'a', 'p'].includes(req.query.st)) return next(new AppError('Invalid match mode', 400));
  if (req.query.t && !['*', '0', '1', '2', '3'].includes(req.query.t)) return next(new AppError('Invalid scope', 400));
  if ((req.query.xclude || '').length > 200) return next(new AppError('Exclusion too long', 400));
  next();
};
// Validation rules for hadith search
const validateHadithSearch = [validateFilters,
  query('page')
    .default(1)
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer'),
  query('value')
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 }).notEmpty()
    .withMessage('Search value cannot be empty'),
  validateRequest
];

// Validation rules for hadith ID
const validateHadithId = [
  param('id')
    .isLength({ min: 1, max: 2000 }).notEmpty()
    .withMessage('Hadith ID is required')
    .isString()
    .trim()
    .matches(/^[0-9a-zA-Z-_]+$/)
    .withMessage('Invalid hadith ID format'),
  validateRequest
];

// Validation rules for sharh search
const validateSharhSearch = [validateFilters,
  query('page')
    .default(1)
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer'),
  query('value')
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 }).notEmpty()
    .withMessage('Search value cannot be empty'),
  validateRequest
];

// Validation rules for sharh ID
const validateSharhId = [
  param('id')
    .isLength({ min: 1, max: 2000 }).notEmpty()
    .withMessage('Sharh ID is required')
    .isString()
    .trim()
    .matches(/^[0-9]+$/)
    .withMessage('Invalid sharh ID format'),
  validateRequest
];

// Validation rules for sharh text
const validateSharhText = [
  param('text')
  .isString()
  .trim()
  .isLength({ min: 1, max: 2000 }).notEmpty()
  .withMessage('Search text cannot be empty'),
  validateRequest
];

// Validation rules for book ID
const validateBookId = [
  param('id')
    .isLength({ min: 1, max: 2000 }).notEmpty()
    .withMessage('Book ID is required')
    .isString()
    .trim()
    .matches(/^[0-9]+$/)
    .withMessage('Invalid book ID format'),
  validateRequest
];

// Validation rules for mohdith ID
const validateMohdithId = [
  param('id')
    .isLength({ min: 1, max: 2000 }).notEmpty()
    .withMessage('Mohdith ID is required')
    .isString()
    .trim()
    .matches(/^[0-9]+$/)
    .withMessage('Invalid mohdith ID format'),
  validateRequest
];

module.exports = {
  validateHadithSearch,
  validateHadithId,
  validateSharhSearch,
  validateSharhId,
  validateSharhText,
  validateBookId,
  validateMohdithId
};
