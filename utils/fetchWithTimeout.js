const AppError = require('./AppError');
const config = require('../config/config');

const fetchWithTimeout = async (url, options = {}) => {
  const timeout = config.fetchTimeout;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ar,en;q=0.9",
        "Referer": "https://dorar.net/",
        "Origin": "https://dorar.net",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
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
