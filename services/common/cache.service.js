const cache = require('../../utils/cache');

const getCachedResponse = (key) => {
  if (!cache.has(key)) {
    return null;
  }

  const data = cache.get(key);
  const metadata = cache.get(`metadata:${key}`) || {};

  return {
    data,
    metadata,
    isCached: true,
  };
};

const setCachedResponse = (key, data, metadata = {}) => {
  cache.set(key, data);
  cache.set(`metadata:${key}`, metadata);

  return {
    data,
    metadata,
    isCached: false,
  };
};

module.exports = {
  getCachedResponse,
  setCachedResponse,
};
