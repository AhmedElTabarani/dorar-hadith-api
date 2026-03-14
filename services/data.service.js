const fs = require('fs');

const { getCachedResponse, setCachedResponse } = require('./common/cache.service');

const getData = async (file) => {
  const cacheKey = `local-data:${file}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await new Promise((resolve, reject) => {
    fs.readFile(
      `${__dirname}/../data/${file}.json`,
      'utf-8',
      (err, content) => (err ? reject(err) : resolve(JSON.parse(content))),
    );
  });

  return setCachedResponse(cacheKey, data, { length: data.length || 0 });
};

module.exports = {
  getData,
};
