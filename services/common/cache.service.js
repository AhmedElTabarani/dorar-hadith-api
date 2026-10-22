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

const setCachedResponse = (key, data, metadata = {}, ttl) => {
  cache.set(key, data, ttl);
  cache.set(`metadata:${key}`, metadata, ttl);

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
