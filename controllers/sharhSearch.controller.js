const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const cache = require('../utils/cache');
const AppError = require('../utils/AppError');
const fetchWithTimeout = require('../utils/fetchWithTimeout');
const serializeQueryParams = require('../utils/serializeQueryParams');

const getSharhById = async (sharhId) => {
  if (!sharhId) {
    throw new AppError('Sharh ID is required', 400);
  }

  const url = `https://www.dorar.net/hadith/sharh/${sharhId}`;
  const response = await fetchWithTimeout(url);

  const html = decode(await response.text());
  const doc = parseHTML(html).document;

  const article = doc.querySelector('article');
  if (!article) {
    throw new AppError('Invalid response structure from Dorar', 502);
  }

  try {
    const hadith = article.textContent.replace(/-\s*/g, '').trim();

    const [rawi, mohdith, book, numberOrPage, grade, takhrij] = [
      ...doc.querySelectorAll('.primary-text-color'),
    ].map((el) => el.textContent.trim());

    const sharhElement = doc.querySelector('.text-justify')?.nextElementSibling;
    if (!sharhElement) {
      throw new AppError('Sharh content not found', 404);
    }

    const sharh = sharhElement.textContent.trim();

    const result = {
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
        sharh,
      },
    };

    return result;
  } catch (error) {
    throw new AppError('Error parsing sharh data', 502);
  }
};

class SharhSearchController {
  getOneSharhByIdUsingSiteDorar = catchAsync(async (req, res, next) => {
    const sharhId = req.params.id;
    const url = `https://www.dorar.net/hadith/sharh/${sharhId}`;

    if (cache.has(url)) {
      const result = cache.get(url);
      return sendSuccess(res, 200, result, {
        isCached: true,
      });
    }

    const result = await getSharhById(sharhId);
    cache.set(url, result);

    sendSuccess(res, 200, result, {
      isCached: false,
    });
  });

  getOneSharhByTextUsingSiteDorar = catchAsync(async (req, res, next) => {
    const text = req.params.text;
    if (!text) {
      throw new AppError('Text of sharh is required', 400);
    }

    const url = `https://www.dorar.net/hadith/search?q=${text}${
      req.tab === 'specialist' ? '&all' : ''
    }`;

    if (cache.has(url)) {
      const result = cache.get(url);
      return sendSuccess(res, 200, result, {
        specialist: req.isForSpecialist,
        isCached: true,
      });
    }

    const response = await fetchWithTimeout(url);
    const html = decode(await response.text());
    const doc = parseHTML(html).document;

    const tabElement = doc.querySelector(`#${req.tab}`);
    if (!tabElement) {
      throw new AppError('Invalid response structure from Dorar', 502);
    }

    const sharhId = tabElement.querySelector('a[xplain]')?.getAttribute('xplain');
    if (!sharhId) {
      throw new AppError('No sharh found for the given text', 404);
    }

    const result = await getSharhById(sharhId);
    cache.set(url, result);

    sendSuccess(res, 200, result, {
      specialist: req.isForSpecialist,
      isCached: false,
    });
  });

  getAllSharhUsingSiteDorar = catchAsync(async (req, res, next) => {
    const query = serializeQueryParams(req.query).replace('value=', 'q=') || '';
    const url = `https://www.dorar.net/hadith/search?${query}${
      req.tab === 'specialist' ? '&all' : ''
    }`;

    if (cache.has(url)) {
      const result = cache.get(url);
      return sendSuccess(res, 200, result, {
        ...cache.get(`metadata:${url}`),
        isCached: true,
      });
    }

    const response = await fetchWithTimeout(url);
    const html = decode(await response.text());
    const doc = parseHTML(html).document;

    const tabElement = doc.querySelector(`#${req.tab}`);
    if (!tabElement) {
      throw new AppError('Invalid response structure from Dorar', 502);
    }

    const sharhIds = Array.from(doc.querySelectorAll(`#${req.tab} .border-bottom`))
      .map((info) => info.querySelector('a[xplain]')?.getAttribute('xplain'))
      .filter((id) => id !== undefined && id !== '0');

    if (sharhIds.length === 0) {
      return sendSuccess(res, 200, [], {
        length: 0,
        page: req.query.page,
        removeHTML: req.isRemoveHTML,
        specialist: req.isForSpecialist,
        isCached: false,
      });
    }

    const result = await Promise.all(
      sharhIds.map((sharhId) => getSharhById(sharhId))
    );

    cache.set(url, result);

    const metadata = {
      length: result.length,
      page: req.query.page,
      removeHTML: req.isRemoveHTML,
      specialist: req.isForSpecialist,
    };

    cache.set(`metadata:${url}`, metadata);

    sendSuccess(res, 200, result, {
      ...metadata,
      isCached: false,
    });
  });
}

module.exports = new SharhSearchController();
