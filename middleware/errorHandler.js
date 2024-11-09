const AppError = require('../utils/AppError');

const handleTimeoutError = err => {
  return new AppError('Request timeout', 408);
};

const handleParsingError = err => {
  return new AppError('Error parsing response', 502);
};

const handleNotFoundError = (err, req) => {
  // Extract resource type and context from URL
  const path = req.path.toLowerCase();
  if (path.includes('sharh')) {
    if (path.includes('text/')) {
      return new AppError('No sharh found for the given text', 404);
    }
    return new AppError('Sharh not found', 404);
  } else if (path.includes('hadith')) {
    return new AppError('Hadith not found', 404);
  }
  return new AppError('Resource not found', 404);
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

    if (err.name === 'TimeoutError' || err.code === 'ECONNABORTED') error = handleTimeoutError(error);
    if (err.message.includes('parsing')) error = handleParsingError(error);
    if (
      error.statusCode === 404 || 
      error.status === 404 || 
      error.message.includes('Not Found')
    ) error = handleNotFoundError(error, req);

    sendErrorProd(error, res);
  }
};
