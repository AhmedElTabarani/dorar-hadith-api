const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationError = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleFetchError = err => {
  if (err.statusCode === 404) {
    return new AppError('not found', 404);
  }
  if (err.message.includes('Failed to fetch')) {
    return new AppError('Service unavailable', 503);
  }
  return new AppError('Failed to fetch data', 502);
};

const handleTimeoutError = err => {
  return new AppError('Request timeout', 408);
};

const handleParsingError = err => {
  return new AppError('Error parsing response', 502);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.statusCode >= 500 ? 'error' : 'fail',
      message: err.message
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // Log error for debugging
    console.error('ERROR 💥', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode;

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.name === 'ValidationError') error = handleValidationError(error);
    if (err.name === 'FetchError' || err.message.includes('fetch')) error = handleFetchError(error);
    if (err.name === 'TimeoutError' || err.code === 'ECONNABORTED') error = handleTimeoutError(error);
    if (err.message.includes('parsing')) error = handleParsingError(error);

    // Special case for sharh not found
    if (err.statusCode === 404 && req.originalUrl.includes('/sharh')) {
      error.message = 'Sharh not found';
    }

    sendErrorProd(error, res);
  }
};
