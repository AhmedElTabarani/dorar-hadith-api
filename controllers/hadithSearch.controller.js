const nodeFetch = require('node-fetch');
const getJSON = require('get-json');
const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const cache = require('../utils/cache');

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

    const data = await getJSON(url);
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
        hasSharhMetadata: !!sharhId,
        sharhMetadata: sharhId
          ? {
              id: sharhId,
              isContainSharh: false,
              urlToGetSharh: `/v1/site/sharh/?id=${sharhId}`,
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

    sendSuccess(res, 200, cache.get(url), {
      ...metadata,
      isCached: false,
    });
  });
}

module.exports = new HadithSearchController();
