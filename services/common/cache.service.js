const store = require('./store');
const config = require('../../config/config');
const getCachedResponse = async key => {
  const entry = await store.get(key);
  require('../../utils/metrics').add(entry ? 'cache_hits' : 'cache_misses');
  return entry ? { ...entry, isCached: true } : null;
};
const setCachedResponse = async (key, data, metadata = {}) => {
  const value = { data, metadata: { ...metadata, parserVersion: '2', retrievedAt: new Date().toISOString() } };
  await store.set(key, value, config.cacheEach);
  return { ...value, isCached: false };
};
module.exports = { getCachedResponse, setCachedResponse };
