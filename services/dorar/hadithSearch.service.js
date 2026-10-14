const serializeQueryParams = require('../../utils/serializeQueryParams');
const AppError = require('../../utils/AppError');
const config = require('../../config/config');

const { getCachedResponse, setCachedResponse } = require('../common/cache.service');
const { fetchDocument, fetchDecodedJsonBody } = require('../common/dorarFetch.service');
const {
  mapSiteHadithBlock,
  mapApiHadithInfo,
  extractUsulSources,
} = require('../common/hadithMapper.service');

const searchUsingAPIDorar = async ({ queryParams, isRemoveHTML }) => {
  const query = serializeQueryParams(queryParams).replace('value=', 'skey=') || '';
  const url = `https://dorar.net/dorar_api.json?${query}`;
  const cacheKey = JSON.stringify(['v2', 'searchUsingAPIDorar', url, typeof isRemoveHTML === 'undefined' ? true : isRemoveHTML, typeof tab === 'undefined' ? '' : tab]);

  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await fetchDecodedJsonBody(url);
  if (!data.ahadith?.result) {
    throw new AppError('Invalid response from Dorar API', 502);
  }

  const { parseHTML } = require('linkedom');
  const { decode } = require('html-entities');
  const doc = parseHTML(decode(data.ahadith.result)).document;

  const result = Array.from(doc.querySelectorAll('.hadith-info'))
    .map((info) => {
      try {
        return mapApiHadithInfo(info, isRemoveHTML);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);

  if (result.length === 0 && !/لا توجد نتائج|لا يوجد نتائج|لم يتم العثور/.test(doc.textContent || doc.documentElement?.textContent || '')) {
    throw new AppError('No hadith found in the response', 502);
  }

  const parsedCount = result.length;
  const currentPage = parseInt(queryParams.page, 10) || 1;
  const hasNextPage = result.length === config.hadithApiPageSize;
  const hasPrevPage = currentPage > 1;

  const metadata = {
    length: result.length,
    parsedCount,
    partial: result.length < doc.querySelectorAll(typeof tab === 'undefined' ? '.hadith-info' : `#${tab} .border-bottom`).length,
    currentPageCount: result.length,
    page: currentPage,
    hasNextPage,
    hasPrevPage,
    removeHTML: isRemoveHTML,
  };

  return setCachedResponse(cacheKey, result, metadata);
};

const searchUsingSiteDorar = async ({ queryParams, tab, isRemoveHTML, isForSpecialist }) => {
  const query = serializeQueryParams(queryParams).replace('value=', 'q=') || '';
  const url = `https://www.dorar.net/hadith/search?${query}${tab === 'specialist' ? '&all' : ''}`;
  const cacheKey = JSON.stringify(['v2', 'searchUsingSiteDorar', url, typeof isRemoveHTML === 'undefined' ? true : isRemoveHTML, typeof tab === 'undefined' ? '' : tab]);

  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  const doc = await fetchDocument(url);
  const tabElement = doc.querySelector(`#${tab}`);
  if (!tabElement) {
    throw new AppError('Invalid response structure from Dorar', 502);
  }

  const numberOfNonSpecialist =
    +doc
      .querySelector('a[aria-controls="home"]')
      ?.textContent.match(/\d+/)?.[0] || 0;

  const numberOfSpecialist =
    +doc
      .querySelector('a[aria-controls="specialist"]')
      ?.textContent.match(/\d+/)?.[0] || 0;

  const result = Array.from(doc.querySelectorAll(`#${tab} .border-bottom`))
    .map((info) => {
      try {
        return mapSiteHadithBlock(info, {
          removeHTML: isRemoveHTML,
          hadithCleanRegex: /^\s*\d+\s+-\s*/,
        });
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);

  const parsedCount = result.length;
  if (!result.length && tabElement.querySelectorAll('.border-bottom').length) throw new AppError('Source parser yielded no records', 502);
  if (!result.length && !/لا توجد نتائج|لا يوجد نتائج|لم يتم العثور/.test(tabElement.textContent) && !doc.querySelector(`a[aria-controls="${tab}"]`)?.textContent.match(/\b0\b/)) throw new AppError('Unrecognized empty source page', 502);
  const currentPage = parseInt(queryParams.page, 10) || 1;
  const total = isForSpecialist ? numberOfSpecialist : numberOfNonSpecialist;
  const totalPages = Math.ceil(total / config.hadithSitePageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const metadata = {
    length: result.length,
    parsedCount,
    partial: result.length < doc.querySelectorAll(typeof tab === 'undefined' ? '.hadith-info' : `#${tab} .border-bottom`).length,
    currentPageCount: result.length,
    total,
    page: currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    removeHTML: isRemoveHTML,
    specialist: isForSpecialist,
    numberOfNonSpecialist,
    numberOfSpecialist,
  };

  return setCachedResponse(cacheKey, result, metadata);
};

const getOneHadithUsingSiteDorarById = async ({ hadithId }) => {
  const url = `https://www.dorar.net/h/${hadithId}`;
  const cacheKey = JSON.stringify(['v2', 'getOneHadithUsingSiteDorarById', url, typeof isRemoveHTML === 'undefined' ? true : isRemoveHTML, typeof tab === 'undefined' ? '' : tab]);

  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  const doc = await fetchDocument(url);
  const info = doc.querySelector('.border-bottom');
  if (!info) {
    throw new AppError('Invalid response structure from Dorar', 502);
  }

  const result = mapSiteHadithBlock(info, {
    removeHTML: true,
    hadithNode: info.children[0],
    infoNode: info,
    hadithCleanRegex: /^\s*-\s*:?\s*/,
  });

  result.hadithId ||= hadithId;
  if (result.hadithId !== hadithId) throw new AppError('Source identity mismatch', 502);
  return setCachedResponse(cacheKey, result, { length: 1 });
};

const getAllSimilarHadithUsingSiteDorar = async ({ similarId }) => {
  const url = `https://www.dorar.net/h/${similarId}?sims=1`;
  const cacheKey = JSON.stringify(['v2', 'getAllSimilarHadithUsingSiteDorar', url, typeof isRemoveHTML === 'undefined' ? true : isRemoveHTML, typeof tab === 'undefined' ? '' : tab]);

  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  const doc = await fetchDocument(url);
  const result = Array.from(doc.querySelectorAll('.border-bottom'))
    .map((info) => {
      try {
        return mapSiteHadithBlock(info, {
          removeHTML: true,
          hadithNode: info.children[0],
          infoNode: info.children[1],
          hadithCleanRegex: /^\s*-\s*:?\s*/,
        });
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);

  return setCachedResponse(cacheKey, result, { length: result.length });
};

const getAlternateHadithUsingSiteDorar = async ({ alternateId }) => {
  const url = `https://www.dorar.net/h/${alternateId}?alts=1`;
  const cacheKey = JSON.stringify(['v2', 'getAlternateHadithUsingSiteDorar', url, typeof isRemoveHTML === 'undefined' ? true : isRemoveHTML, typeof tab === 'undefined' ? '' : tab]);

  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  const doc = await fetchDocument(url);
  const info = doc.querySelectorAll('.border-bottom')[1];
  if (!info) {
    throw new AppError('No alternate hadith found', 404);
  }

  const result = mapSiteHadithBlock(info, {
    removeHTML: true,
    hadithNode: info.children[0],
    infoNode: info.children[1],
    hadithCleanRegex: /^\s*-\s*:?\s*/,
    includeAlternate: false,
  });

  return setCachedResponse(cacheKey, result, {});
};

const getUsulHadithUsingSiteDorar = async ({ usulId }) => {
  const url = `https://www.dorar.net/h/${usulId}?osoul=1`;
  const cacheKey = JSON.stringify(['v2', 'getUsulHadithUsingSiteDorar', url, typeof isRemoveHTML === 'undefined' ? true : isRemoveHTML, typeof tab === 'undefined' ? '' : tab]);

  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  const doc = await fetchDocument(url);
  const mainInfo = doc.querySelector('.border-bottom');
  if (!mainInfo) {
    throw new AppError('No usul hadith found', 404);
  }

  const baseResult = mapSiteHadithBlock(mainInfo, {
    removeHTML: true,
    hadithNode: mainInfo.children[0],
    infoNode: mainInfo.children[1],
    hadithCleanRegex: /^\s*-\s*:?\s*/,
  });

  const usulSources = extractUsulSources(doc);
  const result = {
    ...baseResult,
    hasUsulHadith: true,
    usulHadith: {
      sources: usulSources,
      count: usulSources.length,
    },
  };

  return setCachedResponse(cacheKey, result, {
    length: 1,
    usulSourcesCount: usulSources.length,
  });
};

module.exports = require('../common/singleFlight')({
  searchUsingAPIDorar,
  searchUsingSiteDorar,
  getOneHadithUsingSiteDorarById,
  getAllSimilarHadithUsingSiteDorar,
  getAlternateHadithUsingSiteDorar,
  getUsulHadithUsingSiteDorar,
});
