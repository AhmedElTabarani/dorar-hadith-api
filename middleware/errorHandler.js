module.exports = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.statusCode || 502;
  if (status === 429 || status === 503) res.set('Retry-After', '60');
  res.status(status).json({ code: status === 429 ? 'source_budget_exhausted' : status === 404 ? 'not_found' : status === 400 ? 'validation_error' : 'source_unavailable', message: status < 500 ? error.message : 'Source unavailable; please retry.', retryable: status >= 500 || status === 429 });
};
