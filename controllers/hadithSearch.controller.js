const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const cache = require('../utils/cache');
const getSimilarHadithDorar = require('../utils/getSimilarHadithDorar');
const getHadithId = require('../utils/getHadithId');
const getAlternateHadithSahihDorar = require('../utils/getAlternateHadithSahihDorar');
const AppError = require('../utils/AppError');
const fetchWithTimeout = require('../utils/fetchWithTimeout');
const serializeQueryParams = require('../utils/serializeQueryParams');

class HadithSearchController {
  searchUsingAPIDorar = catchAsync(async (req, res, next) => {
    const query = serializeQueryParams(req.query).replace('value=', 'skey=') || '';
    const url = `https://dorar.net/dorar_api.json?${query}`;

    if (cache.has(url)) {
      const result = cache.get(url);
      return sendSuccess(res, 200, result, {
        ...cache.get(`metadata:${url}`),
        isCached: true,
      });
    }

    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (!data.ahadith?.result) {
      throw new AppError('Invalid response from Dorar API', 502);
    }

    const html = decode(data.ahadith.result);
    const doc = parseHTML(html).document;

    const result = Array.from(doc.querySelectorAll('.hadith-info'))
      .map((info) => {
        try {
          let hadith;
          if (req.isRemoveHTML)
            hadith = info.previousElementSibling.textContent
              .replace(/\d+ -/g, '')
              .trim();
          else
            hadith = info.previousElementSibling.innerHTML
              .replace(/\d+ -/g, '')
              .trim();

          const [rawi, mohdith, book, numberOrPage, grade] = [
            ...info.querySelectorAll('.info-subtitle'),
          ].map((el) => {
            let nextEle = el.nextSibling;
            while (nextEle && nextEle.textContent.trim().length === 0)
              nextEle = nextEle.nextSibling;
            return nextEle ? nextEle.textContent.trim() : '';
          });

          return {
            hadith,
            rawi,
            mohdith,
            book,
            numberOrPage,
            grade,
          };
        } catch (error) {
          console.error('Error parsing hadith:', error);
          return null;
        }
      })
      .filter(Boolean); // Remove any null results from parsing errors

    if (result.length === 0) {
      throw new AppError('No hadith found in the response', 502);
    }

    cache.set(url, result);

    const metadata = {
      length: result.length,
      page: req.query.page,
      removeHTML: req.isRemoveHTML,
    };
    cache.set(`metadata:${url}`, metadata);

    sendSuccess(res, 200, result, {
      ...metadata,
      isCached: false,
    });
  });

  searchUsingSiteDorar = catchAsync(async (req, res, next) => {
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

    const numberOfNonSpecialist =
      +doc
        .querySelector('a[aria-controls="home"]')
        ?.textContent.match(/\d+/)?.[0] || 0;

    const numberOfSpecialist =
      +doc
        .querySelector('a[aria-controls="specialist"]')
        ?.textContent.match(/\d+/)?.[0] || 0;

    const result = Array.from(
      doc.querySelectorAll(`#${req.tab} .border-bottom`)
    )
      .map((info) => {
        try {
          let hadith;
          if (req.isRemoveHTML)
            hadith = info.children[0].textContent
              .replace(/\d+\s+-/g, '')
              .trim();
          else
            hadith = info.children[0].innerHTML
              .replace(/\d+\s+-/g, '')
              .trim();

          const [
            rawi,
            mohdith,
            book,
            numberOrPage,
            grade,
            explainGradeOrTakhrij,
          ] = [
            ...info.children[1].querySelectorAll('.primary-text-color'),
          ].map((el) => el.textContent.trim());

          const [explainGrade, takhrij] =
            req.tab === 'home'
              ? [explainGradeOrTakhrij, undefined]
              : [undefined, explainGradeOrTakhrij];

          const sharhId = info.querySelector('a[xplain]')?.getAttribute('xplain');

          const mohdithId = info
            .querySelector('a[view-card="mhd"]')
            ?.getAttribute('card-link')
            ?.match(/\d+/)?.[0];

          const bookId = info
            .querySelector('a[view-card="book"]')
            ?.getAttribute('card-link')
            ?.match(/\d+/)?.[0];

          const [similarHadithDorar, alternateHadithSahihDorar] = [
            getSimilarHadithDorar(info),
            getAlternateHadithSahihDorar(info),
          ];

          const hadithId = getHadithId(info);

          return {
            hadith,
            rawi,
            mohdith,
            mohdithId,
            book,
            bookId,
            numberOrPage,
            grade,
            explainGrade,
            takhrij,
            hadithId,
            hasSimilarHadith: !!similarHadithDorar,
            hasAlternateHadithSahih: !!alternateHadithSahihDorar,
            similarHadithDorar,
            alternateHadithSahihDorar,
            urlToGetSimilarHadith: similarHadithDorar
              ? `/v1/site/hadith/similar/${hadithId}`
              : undefined,
            urlToGetAlternateHadithSahih: alternateHadithSahihDorar
              ? `/v1/site/hadith/alternate/${hadithId}`
              : undefined,
            hasSharhMetadata: !!sharhId,
            sharhMetadata: sharhId
              ? {
                  id: sharhId,
                  isContainSharh: false,
                  urlToGetSharh: `/v1/site/sharh/${sharhId}`,
                }
              : undefined,
          };
        } catch (error) {
          console.error('Error parsing hadith:', error);
          return null;
        }
      })
      .filter(Boolean); // Remove any null results from parsing errors

    cache.set(url, result);

    const metadata = {
      length: result.length,
      page: req.query.page,
      removeHTML: req.isRemoveHTML,
      specialist: req.isForSpecialist,
      numberOfNonSpecialist,
      numberOfSpecialist,
    };
    cache.set(`metadata:${url}`, metadata);

    sendSuccess(res, 200, result, {
      ...metadata,
      isCached: false,
    });
  });

  getOneHadithUsingSiteDorarById = catchAsync(async (req, res, next) => {
    const hadithId = req.params.id;
    const url = `https://www.dorar.net/h/${hadithId}`;

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

    const info = doc.querySelector(`.border-bottom`);
    if (!info) {
      throw new AppError('Invalid response structure from Dorar', 502);
    }

    const hadith = info.children[0].textContent
      .replace(/-\s*\:?\s*/g, '')
      .trim();

    const [rawi, mohdith, book, numberOrPage, grade, explainGrade] = [
      ...info.querySelectorAll('.primary-text-color'),
    ].map((el) => el.textContent.trim());

    let sharhId = info.querySelector('a[xplain]')?.getAttribute('xplain');
    sharhId = sharhId === '0' ? undefined : sharhId;

    const mohdithId = info
      .querySelector('a[view-card="mhd"]')
      ?.getAttribute('card-link')
      ?.match(/\d+/)?.[0];

    const bookId = info
      .querySelector('a[view-card="book"]')
      ?.getAttribute('card-link')
      ?.match(/\d+/)?.[0];

    const [similarHadithDorar, alternateHadithSahihDorar] = [
      getSimilarHadithDorar(info),
      getAlternateHadithSahihDorar(info),
    ];

    const result = {
      hadith,
      rawi,
      mohdith,
      mohdithId,
      book,
      bookId,
      numberOrPage,
      grade,
      explainGrade,
      hadithId,
      hasSimilarHadith: !!similarHadithDorar,
      hasAlternateHadithSahih: !!alternateHadithSahihDorar,
      similarHadithDorar,
      alternateHadithSahihDorar,
      urlToGetSimilarHadith: similarHadithDorar
        ? `/v1/site/hadith/similar/${hadithId}`
        : undefined,
      urlToGetAlternateHadithSahih: alternateHadithSahihDorar
        ? `/v1/site/hadith/alternate/${hadithId}`
        : undefined,
      hasSharhMetadata: !!sharhId,
      sharhMetadata: sharhId
        ? {
            id: sharhId,
            isContainSharh: false,
            urlToGetSharh: `/v1/site/sharh/${sharhId}`,
          }
        : undefined,
    };

    cache.set(url, result);

    const metadata = {
      length: 1,
    };
    cache.set(`metadata:${url}`, metadata);

    sendSuccess(res, 200, result, {
      ...metadata,
      isCached: false,
    });
  });

  getAllSimilarHadithUsingSiteDorar = catchAsync(async (req, res, next) => {
    const similarId = req.params.id;
    const url = `https://www.dorar.net/h/${similarId}?sims=1`;

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

    const result = Array.from(doc.querySelectorAll(`.border-bottom`))
      .map((info) => {
        try {
          const hadith = info.children[0].textContent
            .replace(/-\s*\:?\s*/g, '')
            .trim();

          const [rawi, mohdith, book, numberOrPage, grade, explainGrade] = [
            ...info.children[1].querySelectorAll('.primary-text-color'),
          ].map((el) => el.textContent.trim());

          let sharhId = info.querySelector('a[xplain]')?.getAttribute('xplain');
          sharhId = sharhId === '0' ? undefined : sharhId;

          const mohdithId = info
            .querySelector('a[view-card="mhd"]')
            ?.getAttribute('card-link')
            ?.match(/\d+/)?.[0];

          const bookId = info
            .querySelector('a[view-card="book"]')
            ?.getAttribute('card-link')
            ?.match(/\d+/)?.[0];

          const [similarHadithDorar, alternateHadithSahihDorar] = [
            getSimilarHadithDorar(info),
            getAlternateHadithSahihDorar(info),
          ];

          const hadithId = getHadithId(info);

          return {
            hadith,
            rawi,
            mohdith,
            mohdithId,
            book,
            bookId,
            numberOrPage,
            grade,
            explainGrade,
            hadithId,
            hasSimilarHadith: !!similarHadithDorar,
            hasAlternateHadithSahih: !!alternateHadithSahihDorar,
            similarHadithDorar,
            alternateHadithSahihDorar,
            urlToGetSimilarHadith: similarHadithDorar
              ? `/v1/site/hadith/similar/${hadithId}`
              : undefined,
            urlToGetAlternateHadithSahih: alternateHadithSahihDorar
              ? `/v1/site/hadith/alternate/${hadithId}`
              : undefined,
            hasSharhMetadata: !!sharhId,
            sharhMetadata: sharhId
              ? {
                  id: sharhId,
                  isContainSharh: false,
                  urlToGetSharh: `/v1/site/sharh/${sharhId}`,
                }
              : undefined,
          };
        } catch (error) {
          console.error('Error parsing similar hadith:', error);
          return null;
        }
      })
      .filter(Boolean);

    cache.set(url, result);

    const metadata = {
      length: result.length,
    };
    cache.set(`metadata:${url}`, metadata);

    sendSuccess(res, 200, result, {
      ...metadata,
      isCached: false,
    });
  });

  getAlternateHadithUsingSiteDorar = catchAsync(async (req, res, next) => {
    const alternateId = req.params.id;
    const url = `https://www.dorar.net/h/${alternateId}?alts=1`;

    if (cache.has(url)) {
      const result = cache.get(url);
      return sendSuccess(res, 200, result, {
        isCached: true,
      });
    }

    const response = await fetchWithTimeout(url);
    const html = decode(await response.text());
    const doc = parseHTML(html).document;

    const info = doc.querySelectorAll('.border-bottom')[1];
    if (!info) {
      throw new AppError('No alternate hadith found', 404);
    }

    const hadith = info.children[0].textContent
      .replace(/-\s*\:?\s*/g, '')
      .trim();

    const [rawi, mohdith, book, numberOrPage, grade] = [
      ...info.children[1].querySelectorAll('.primary-text-color'),
    ].map((el) => el.textContent.trim());

    const sharhId = info.querySelector('a[xplain]')?.getAttribute('xplain');

    const mohdithId = info
      .querySelector('a[view-card="mhd"]')
      ?.getAttribute('card-link')
      ?.match(/\d+/)?.[0];

    const bookId = info
      .querySelector('a[view-card="book"]')
      ?.getAttribute('card-link')
      ?.match(/\d+/)?.[0];

    const similarHadithDorar = getSimilarHadithDorar(info);

    const hadithId = getHadithId(info);

    const result = {
      hadith,
      rawi,
      mohdith,
      mohdithId,
      book,
      bookId,
      numberOrPage,
      grade,
      hadithId,
      hasSimilarHadith: !!similarHadithDorar,
      hasAlternateHadithSahih: false,
      similarHadithDorar,
      urlToGetSimilarHadith: similarHadithDorar
        ? `/v1/site/hadith/similar/${hadithId}`
        : undefined,
      hasSharhMetadata: !!sharhId,
      sharhMetadata: sharhId
        ? {
            id: sharhId,
            isContainSharh: false,
            urlToGetSharh: `/v1/site/sharh/${sharhId}`,
          }
        : undefined,
    };

    cache.set(url, result);

    sendSuccess(res, 200, result, {
      isCached: false,
    });
  });
}

module.exports = new HadithSearchController();
