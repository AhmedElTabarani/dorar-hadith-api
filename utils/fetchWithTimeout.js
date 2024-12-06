const AppError = require('./AppError');
const config = require('../config/config');

const fetchWithTimeout = async (url, options = {}) => {
  const timeout = config.fetchTimeout;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok) {
      throw new AppError(`Failed to fetch data: ${response.statusText}`, response.status);
    }

    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new AppError('Request timeout. Please try again later.', 408);
    }
    throw error;
  }
};

module.exports = fetchWithTimeout;
