const AppError = require('../../utils/AppError');
const { getCachedResponse, setCachedResponse } = require('../common/cache.service');
const { fetchDocument } = require('../common/dorarFetch.service');

const getOneMohdithByIdUsingSiteDorar = async ({ mohdithId }) => {
  if (!mohdithId) {
    throw new AppError('Mohdith ID is required', 400);
  }

  const url = `https://www.dorar.net/hadith/mhd/${mohdithId}`;
  const cacheKey = JSON.stringify(['v2', 'getOneMohdithByIdUsingSiteDorar', url, typeof isRemoveHTML === 'undefined' ? true : isRemoveHTML, typeof tab === 'undefined' ? '' : tab]);

  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  const doc = await fetchDocument(url);
  const h4 = doc.querySelector('h4');

  if (!h4) throw new AppError('Invalid scholar structure', 502);
  const result = {
    name: h4.textContent,
    mohdithId,
    info: h4.nextSibling?.textContent.trim() || '',
  };

  return setCachedResponse(cacheKey, result, {});
};

module.exports = require('../common/singleFlight')({
  getOneMohdithByIdUsingSiteDorar,
});
