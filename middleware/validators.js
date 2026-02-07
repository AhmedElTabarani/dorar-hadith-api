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
    .default(1)
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('value')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Search value cannot be empty'),
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
    .default(1)
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('value')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Search value cannot be empty'),
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
  .isString()
  .trim()
  .notEmpty()
  .withMessage('Search text cannot be empty'),
  validateRequest
];

// Validation rules for book ID
const validateBookId = [
  param('id')
    .notEmpty()
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
    .notEmpty()
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
