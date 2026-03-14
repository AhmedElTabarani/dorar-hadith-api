const AppError = require('../../utils/AppError');
const { getCachedResponse, setCachedResponse } = require('../common/cache.service');
const { fetchDocument } = require('../common/dorarFetch.service');

const getOneMohdithByIdUsingSiteDorar = async ({ mohdithId }) => {
  if (!mohdithId) {
    throw new AppError('Mohdith ID is required', 400);
  }

  const url = `https://www.dorar.net/hadith/mhd/${mohdithId}`;

  const cached = getCachedResponse(url);
  if (cached) {
    return cached;
  }

  const doc = await fetchDocument(url);
  const h4 = doc.querySelector('h4');

  const result = {
    name: h4.textContent,
    mohdithId,
    info: h4.nextSibling.textContent.trim(),
  };

  return setCachedResponse(url, result, {});
};

module.exports = {
  getOneMohdithByIdUsingSiteDorar,
};
