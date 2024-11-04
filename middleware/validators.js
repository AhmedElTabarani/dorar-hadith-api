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

// Validation rules for hadith search
const validateHadithSearch = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('removehtml')
    .optional()
    .isBoolean()
    .withMessage('removehtml must be true or false'),
  query('specialist')
    .optional()
    .isBoolean()
    .withMessage('specialist must be true or false'),
  query('value')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Search value cannot be empty')
    .isLength({ max: 500 })
    .withMessage('Search value is too long'),
  validateRequest
];

// Validation rules for hadith ID
const validateHadithId = [
  param('id')
    .notEmpty()
    .withMessage('Hadith ID is required')
    .isString()
    .trim()
    .matches(/^[0-9a-zA-Z-_]+$/)
    .withMessage('Invalid hadith ID format'),
  validateRequest
];

// Validation rules for sharh search
const validateSharhSearch = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('specialist')
    .optional()
    .isBoolean()
    .withMessage('specialist must be true or false'),
  query('value')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Search value cannot be empty')
    .isLength({ max: 500 })
    .withMessage('Search value is too long'),
  validateRequest
];

// Validation rules for sharh ID
const validateSharhId = [
  param('id')
    .notEmpty()
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
    .notEmpty()
    .withMessage('Sharh text is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Sharh text must be between 3 and 500 characters'),
  validateRequest
];

module.exports = {
  validateHadithSearch,
  validateHadithId,
  validateSharhSearch,
  validateSharhId,
  validateSharhText
};
