module.exports = (res, statusCode, data, metadata) =>
  res.status(statusCode).json({
    status: 'success',
    metadata,
    data,
  });
