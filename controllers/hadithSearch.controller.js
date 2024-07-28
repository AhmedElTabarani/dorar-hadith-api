const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const cache = require('../utils/cache');
const getSimilarHadithDorar = require('../utils/getSimilarHadithDorar');
const getHadithId = require('../utils/getHadithId');
const getAlternateHadithSahihDorar = require('../utils/getAlternateHadithSahihDorar');

class HadithSearchController {
  searchUsingAPIDorar = catchAsync(async (req, res, next) => {
    const query =
      req._parsedUrl.query?.replace('value=', 'skey=') || '';
    const url = `https://dorar.net/dorar_api.json?${query}`;

    if (cache.has(url)) {
      const result = cache.get(url);
      return sendSuccess(res, 200, result, {
        ...cache.get(`metadata:${url}`),
        isCached: true,
      });
    }

    const _res = await nodeFetch(url);
    const data = await _res.json();
    const html = decode(data.ahadith.result);
    const doc = parseHTML(html).document;

    const result = Array.from(
      doc.querySelectorAll('.hadith-info'),
    ).map((info) => {
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
        if (nextEle.textContent.trim().length === 0)
          nextEle = nextEle.nextSibling;
        return nextEle.textContent.trim();
      });

      return {
        hadith,
        rawi,
        mohdith,
        book,
        numberOrPage,
        grade,
      };
    });

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
    const query = req._parsedUrl.query?.replace('value=', 'q=') || '';
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

    const data = await nodeFetch(url);
    const html = decode(await data.text());
    const doc = parseHTML(html).document;

    const numberOfNonSpecialist = +doc
      .querySelector('a[aria-controls="home"]')
      .textContent.match(/\d+/)[0];

    const numberOfSpecialist = +doc
      .querySelector('a[aria-controls="specialist"]')
      .textContent.match(/\d+/)[0];

    const result = Array.from(
      doc.querySelectorAll(`#${req.tab} .border-bottom`),
    ).map((info) => {
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

      // explainGrade appear only in home tab
      // takhrij appear only in specialist tab
      const [explainGrade, takhrij] =
        req.tab === 'home'
          ? [explainGradeOrTakhrij, undefined]
          : [undefined, explainGradeOrTakhrij];

      const sharhId = info
        .querySelector('a[xplain]')
        ?.getAttribute('xplain');

      const mohdithId = info
        .querySelector('a[view-card="mhd"]')
        ?.getAttribute('card-link')
        ?.match(/\d+/)[0];

      const bookId = info
        .querySelector('a[view-card="book"]')
        ?.getAttribute('card-link')
        ?.match(/\d+/)[0];

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
    });

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

  getOneHadithUsingSiteDorarById = catchAsync(
    async (req, res, next) => {
      const hadithId = req.params.id;
      const url = `https://www.dorar.net/h/${hadithId}`;

      if (cache.has(url)) {
        const result = cache.get(url);
        return sendSuccess(res, 200, result, {
          ...cache.get(`metadata:${url}`),
          isCached: true,
        });
      }

      const data = await nodeFetch(url);
      if (data.status === 404)
        return next(new Error(`Can't find hadith with this id`));

      const html = decode(await data.text());
      const doc = parseHTML(html).document;

      const info = doc.querySelector(`.border-bottom`);
      const hadith = info.children[0].textContent
        .replace(/-\s*\:?\s*/g, '')
        .trim();

      const [rawi, mohdith, book, numberOrPage, grade, explainGrade] =
        [...info.querySelectorAll('.primary-text-color')].map((el) =>
          el.textContent.trim(),
        );

      let sharhId = info
        .querySelector('a[xplain]')
        ?.getAttribute('xplain');

      sharhId = sharhId === '0' ? undefined : sharhId;

      const mohdithId = info
        .querySelector('a[view-card="mhd"]')
        ?.getAttribute('card-link')
        ?.match(/\d+/)[0];

      const bookId = info
        .querySelector('a[view-card="book"]')
        ?.getAttribute('card-link')
        ?.match(/\d+/)[0];

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
        length: result.length,
      };
      cache.set(`metadata:${url}`, metadata);

      sendSuccess(res, 200, result, {
        ...metadata,
        isCached: false,
      });
    },
  );

  getAllSimilarHadithUsingSiteDorar = catchAsync(
    async (req, res, next) => {
      const similarId = req.params.id;
      const url = `https://www.dorar.net/h/${similarId}?sims=1`;

      if (cache.has(url)) {
        const result = cache.get(url);
        return sendSuccess(res, 200, result, {
          ...cache.get(`metadata:${url}`),
          isCached: true,
        });
      }

      const data = await nodeFetch(url);
      if (data.status === 404)
        return next(
          new Error(`Can't find similar hadith with this id`),
        );

      const html = decode(await data.text());
      const doc = parseHTML(html).document;

      const result = Array.from(
        doc.querySelectorAll(`.border-bottom`),
      ).map((info) => {
        const hadith = info.children[0].textContent
          .replace(/-\s*\:?\s*/g, '')
          .trim();

        const [
          rawi,
          mohdith,
          book,
          numberOrPage,
          grade,
          explainGrade,
        ] = [
          ...info.children[1].querySelectorAll('.primary-text-color'),
        ].map((el) => el.textContent.trim());

        let sharhId = info
          .querySelector('a[xplain]')
          ?.getAttribute('xplain');

        sharhId = sharhId === '0' ? undefined : sharhId;

        const mohdithId = info
          .querySelector('a[view-card="mhd"]')
          ?.getAttribute('card-link')
          ?.match(/\d+/)[0];

        const bookId = info
          .querySelector('a[view-card="book"]')
          ?.getAttribute('card-link')
          ?.match(/\d+/)[0];

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
      });

      cache.set(url, result);

      const metadata = {
        length: result.length,
      };
      cache.set(`metadata:${url}`, metadata);

      sendSuccess(res, 200, result, {
        ...metadata,
        isCached: false,
      });
    },
  );

  getAlternateHadithUsingSiteDorar = catchAsync(
    async (req, res, next) => {
      const alternateId = req.params.id;
      const url = `https://www.dorar.net/h/${alternateId}?alts=1`;

      if (cache.has(url)) {
        const result = cache.get(url);
        return sendSuccess(res, 200, result, {
          isCached: true,
        });
      }

      const data = await nodeFetch(url);
      if (data.status === 404)
        return next(
          new Error(`Can't find alternate hadith with this id`),
        );

      const html = decode(await data.text());
      const doc = parseHTML(html).document;

      const info = doc.querySelectorAll('.border-bottom')[1];

      if (!info)
        return next(
          new Error('There is no alternate hadith with this id'),
        );

      const hadith = info.children[0].textContent
        .replace(/-\s*\:?\s*/g, '')
        .trim();

      const [rawi, mohdith, book, numberOrPage, grade] = [
        ...info.children[1].querySelectorAll('.primary-text-color'),
      ].map((el) => el.textContent.trim());

      const sharhId = info
        .querySelector('a[xplain]')
        ?.getAttribute('xplain');

      const mohdithId = info
        .querySelector('a[view-card="mhd"]')
        ?.getAttribute('card-link')
        ?.match(/\d+/)[0];

      const bookId = info
        .querySelector('a[view-card="book"]')
        ?.getAttribute('card-link')
        ?.match(/\d+/)[0];

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
    },
  );
}

module.exports = new HadithSearchController();
