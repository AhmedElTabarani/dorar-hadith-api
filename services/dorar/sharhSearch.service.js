const AppError = require('../../utils/AppError');
const serializeQueryParams = require('../../utils/serializeQueryParams');

const { getCachedResponse, setCachedResponse } = require('../common/cache.service');
const { fetchDocument } = require('../common/dorarFetch.service');

const getSharhById = async (sharhId) => {
  if (!sharhId) {
    throw new AppError('Sharh ID is required', 400);
  }

  const doc = await fetchDocument(`https://www.dorar.net/hadith/sharh/${sharhId}`);

  const article = doc.querySelector('article');
  if (!article) {
    throw new AppError('Invalid response structure from Dorar', 502);
  }

  const hadith = article.textContent.replace(/-\s*/g, '').trim();
  const [rawi, mohdith, book, numberOrPage, grade, takhrij] = [
    ...doc.querySelectorAll('.primary-text-color'),
  ].map((el) => el.textContent.trim());

  const sharhElement = doc.querySelector('.text-justify')?.nextElementSibling;
  if (!sharhElement) {
    throw new AppError('Sharh content not found', 404);
  }

  return {
    hadith,
    rawi,
    mohdith,
    book,
    numberOrPage,
    grade,
    takhrij,
    hasSharhMetadata: true,
    sharhMetadata: {
      id: sharhId,
      isContainSharh: true,
      urlToGetSharhById: `/v1/site/sharh/${sharhId}`,
      sharh: sharhElement.textContent.trim(),
    },
  };
};

const getOneSharhByIdUsingSiteDorar = async ({ sharhId }) => {
  const url = `https://www.dorar.net/hadith/sharh/${sharhId}`;

  const cached = getCachedResponse(url);
  if (cached) {
    return cached;
  }

  const result = await getSharhById(sharhId);
  return setCachedResponse(url, result, {});
};

const getOneSharhByTextUsingSiteDorar = async ({ text, tab, isForSpecialist }) => {
  if (!text) {
    throw new AppError('Text of sharh is required', 400);
  }

  const url = `https://www.dorar.net/hadith/search?q=${text}${tab === 'specialist' ? '&all' : ''}`;

  const cached = getCachedResponse(url);
  if (cached) {
    return {
      ...cached,
      metadata: {
        ...cached.metadata,
        specialist: isForSpecialist,
      },
    };
  }

  const doc = await fetchDocument(url);
  const tabElement = doc.querySelector(`#${tab}`);
  if (!tabElement) {
    throw new AppError('Invalid response structure from Dorar', 502);
  }

  const sharhId = tabElement.querySelector('a[xplain]')?.getAttribute('xplain');
  if (!sharhId) {
    throw new AppError('No sharh found for the given text', 404);
  }

  const result = await getSharhById(sharhId);
  return setCachedResponse(url, result, { specialist: isForSpecialist });
};

const getAllSharhUsingSiteDorar = async ({ queryParams, tab, isRemoveHTML, isForSpecialist }) => {
  const query = serializeQueryParams(queryParams).replace('value=', 'q=') || '';
  const url = `https://www.dorar.net/hadith/search?${query}${tab === 'specialist' ? '&all' : ''}`;

  const cached = getCachedResponse(url);
  if (cached) {
    return cached;
  }

  const doc = await fetchDocument(url);
  const tabElement = doc.querySelector(`#${tab}`);
  if (!tabElement) {
    throw new AppError('Invalid response structure from Dorar', 502);
  }

  const sharhIds = Array.from(doc.querySelectorAll(`#${tab} .border-bottom`))
    .map((info) => info.querySelector('a[xplain]')?.getAttribute('xplain'))
    .filter((id) => id !== undefined && id !== '0');

  if (sharhIds.length === 0) {
    return {
      data: [],
      metadata: {
        length: 0,
        page: queryParams.page,
        removeHTML: isRemoveHTML,
        specialist: isForSpecialist,
      },
      isCached: false,
    };
  }

  const result = await Promise.all(sharhIds.map((id) => getSharhById(id)));
  const metadata = {
    length: result.length,
    page: queryParams.page,
    removeHTML: isRemoveHTML,
    specialist: isForSpecialist,
  };

  return setCachedResponse(url, result, metadata);
};

module.exports = {
  getOneSharhByIdUsingSiteDorar,
  getOneSharhByTextUsingSiteDorar,
  getAllSharhUsingSiteDorar,
};
