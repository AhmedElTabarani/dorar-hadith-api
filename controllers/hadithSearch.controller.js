const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const cache = require('../utils/cache');
const getSimilarHadithDorar = require('../utils/getSimilarHadithDorar');
const getHadithId = require('../utils/getHadithId');
const getAlternateHadithSahihDorar = require('../utils/getAlternateHadithSahihDorar');
const getUsulHadithDorar = require('../utils/getUsulHadithDorar');
const { parseHadithInfo } = require('../utils/parseHadithInfo');
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

          const parsedInfo = parseHadithInfo(info.children[1]);
          const {
            rawi,
            mohdith,
            mohdithId,
            book,
            bookId,
            numberOrPage,
            grade,
            explainGrade,
            takhrij,
            sharhId
          } = parsedInfo;

          const [similarHadithDorar, alternateHadithSahihDorar, usulHadithDorar] = [
            getSimilarHadithDorar(info),
            getAlternateHadithSahihDorar(info),
            getUsulHadithDorar(info),
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
            hasUsulHadith: !!usulHadithDorar,
            similarHadithDorar,
            alternateHadithSahihDorar,
            usulHadithDorar,
            urlToGetSimilarHadith: similarHadithDorar
              ? `/v1/site/hadith/similar/${hadithId}`
              : undefined,
            urlToGetAlternateHadithSahih: alternateHadithSahihDorar
              ? `/v1/site/hadith/alternate/${hadithId}`
              : undefined,
            urlToGetUsulHadith: usulHadithDorar
              ? `/v1/site/hadith/usul/${hadithId}`
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

    const parsedInfo = parseHadithInfo(info);
    const {
      rawi,
      mohdith,
      mohdithId,
      book,
      bookId,
      numberOrPage,
      grade,
      explainGrade,
      sharhId
    } = parsedInfo;

    const [similarHadithDorar, alternateHadithSahihDorar, usulHadithDorar] = [
      getSimilarHadithDorar(info),
      getAlternateHadithSahihDorar(info),
      getUsulHadithDorar(info),
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
      hasUsulHadith: !!usulHadithDorar,
      similarHadithDorar,
      alternateHadithSahihDorar,
      usulHadithDorar,
      urlToGetSimilarHadith: similarHadithDorar
        ? `/v1/site/hadith/similar/${hadithId}`
        : undefined,
      urlToGetAlternateHadithSahih: alternateHadithSahihDorar
        ? `/v1/site/hadith/alternate/${hadithId}`
        : undefined,
      urlToGetUsulHadith: usulHadithDorar
        ? `/v1/site/hadith/usul/${hadithId}`
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

          const parsedInfo = parseHadithInfo(info.children[1]);
          const {
            rawi,
            mohdith,
            mohdithId,
            book,
            bookId,
            numberOrPage,
            grade,
            explainGrade,
            sharhId
          } = parsedInfo;

          const [similarHadithDorar, alternateHadithSahihDorar, usulHadithDorar] = [
            getSimilarHadithDorar(info),
            getAlternateHadithSahihDorar(info),
            getUsulHadithDorar(info),
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
            hasUsulHadith: !!usulHadithDorar,
            similarHadithDorar,
            alternateHadithSahihDorar,
            usulHadithDorar,
            urlToGetSimilarHadith: similarHadithDorar
              ? `/v1/site/hadith/similar/${hadithId}`
              : undefined,
            urlToGetAlternateHadithSahih: alternateHadithSahihDorar
              ? `/v1/site/hadith/alternate/${hadithId}`
              : undefined,
            urlToGetUsulHadith: usulHadithDorar
              ? `/v1/site/hadith/usul/${hadithId}`
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

    const parsedInfo = parseHadithInfo(info.children[1]);
    const {
      rawi,
      mohdith,
      mohdithId,
      book,
      bookId,
      numberOrPage,
      grade,
      sharhId
    } = parsedInfo;

    const [similarHadithDorar, usulHadithDorar] = [
      getSimilarHadithDorar(info),
      getUsulHadithDorar(info),
    ];

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
      hasUsulHadith: !!usulHadithDorar,
      similarHadithDorar,
      usulHadithDorar,
      urlToGetSimilarHadith: similarHadithDorar
        ? `/v1/site/hadith/similar/${hadithId}`
        : undefined,
      urlToGetUsulHadith: usulHadithDorar
        ? `/v1/site/hadith/usul/${hadithId}`
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

  getUsulHadithUsingSiteDorar = catchAsync(async (req, res, next) => {
    const usulId = req.params.id;
    const url = `https://www.dorar.net/h/${usulId}?osoul=1`;

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

    // Get the main hadith info (first .border-bottom)
    const mainInfo = doc.querySelector('.border-bottom');
    if (!mainInfo) {
      throw new AppError('No usul hadith found', 404);
    }

    const mainHadith = mainInfo.children[0].textContent
      .replace(/-\s*\:?\s*/g, '')
      .trim();

    const parsedInfo = parseHadithInfo(mainInfo.children[1]);
    const {
      rawi,
      mohdith,
      mohdithId,
      book,
      bookId,
      numberOrPage,
      grade,
      explainGrade,
      takhrij,
      sharhId
    } = parsedInfo;

    const [similarHadithDorar, alternateHadithSahihDorar] = [
      getSimilarHadithDorar(mainInfo),
      getAlternateHadithSahihDorar(mainInfo),
    ];

    const hadithId = getHadithId(mainInfo);

    // Get the usul hadith sources (all articles after the heading)
    const usulSources = [];
    const articles = doc.querySelectorAll('article');
    
    // Skip the first article (main hadith) and process the rest
    for (let i = 1; i < articles.length; i++) {
      const article = articles[i];
      const sourceInfo = article.querySelector('h5');
      
      if (sourceInfo) {
        // Extract source name and page from the span with maroon color
        const sourceSpan = sourceInfo.querySelector('span[style*="color:maroon"]');
        const sourceName = sourceSpan?.textContent.trim() || '';
        
        // Extract the chain of narration from the span with blue color
        const chainSpan = sourceInfo.querySelector('span[style*="color:blue"]');
        const chain = chainSpan?.textContent.trim() || '';
        
        // Get the full text and extract the hadith text after the colored spans
        let fullText = sourceInfo.textContent.trim();
        
        // Remove the source name and chain to get the actual hadith text
        if (sourceName) {
          fullText = fullText.replace(sourceName, '').trim();
        }
        if (chain) {
          fullText = fullText.replace(chain, '').trim();
        }
        
        // Clean up the hadith text (remove leading commas, periods, etc.)
        const hadithText = fullText.replace(/^[،,.\s]+/, '').trim();
        
        usulSources.push({
          source: sourceName,
          chain: chain,
          hadithText: hadithText
        });
      }
    }

    const result = {
      hadith: mainHadith,
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
      hasUsulHadith: true,
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
      usulHadith: {
        sources: usulSources,
        count: usulSources.length
      }
    };

    cache.set(url, result);

    const metadata = {
      length: 1,
      usulSourcesCount: usulSources.length,
    };
    cache.set(`metadata:${url}`, metadata);

    sendSuccess(res, 200, result, {
      ...metadata,
      isCached: false,
    });
  });

}

module.exports = new HadithSearchController();
