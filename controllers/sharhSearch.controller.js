const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const cache = require('../utils/cache');

const getSharhById = async (sharhId) => {
  const url = `https://www.dorar.net/hadith/sharh/${sharhId}`;

  const data = await nodeFetch(url);
  if (data.status === 404) throw new Error('Sharh not found');

  const html = decode(await data.text());
  const doc = parseHTML(html).document;

  const hadith = doc
    .querySelector('article')
    .textContent.replace(/-\s*/g, '')
    .trim();

  const [rawi, mohdith, book, numberOrPage, grade, takhrij] = [
    ...doc.querySelectorAll('.primary-text-color'),
  ].map((el) => el.textContent.trim());

  const sharh = doc
    .querySelector('.text-justify')
    .nextElementSibling.textContent.trim();

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
};

class SharhSearchController {
  getOneSharhByIdUsingSiteDorar = catchAsync(
    async (req, res, next) => {
      const sharhId = req.params.id;
      if (!sharhId) return next(new Error('Id of sharh is required'));

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
    },
  );

  getOneSharhByTextUsingSiteDorar = catchAsync(
    async (req, res, next) => {
      const text = req.params.text;
      if (!text) return next(new Error('Text of sharh is required'));

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

      const data = await nodeFetch(url);
      const html = decode(await data.text());
      const doc = parseHTML(html).document.querySelector(
        `#${req.tab}`,
      );

      const sharhId = doc
        .querySelector('a[xplain]')
        ?.getAttribute('xplain');

      const result = await getSharhById(sharhId);

      cache.set(url, result);

      sendSuccess(res, 200, result, {
        specialist: req.isForSpecialist,
        isCached: false,
      });
    },
  );

  getAllSharhUsingSiteDorar = catchAsync(async (req, res, next) => {
    const query = req._parsedUrl.query?.replace('value=', 'q=') || '';
    const url = `https://www.dorar.net/hadith/search?${query}${
      req.tab === 'specialist' ? '&all' : ''
    }`;
    console.log(url);

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

    const result = await Promise.all(
      Array.from(doc.querySelectorAll(`#${req.tab} .border-bottom`))
        .map((info) => {
          const sharhId = info
            .querySelector('a[xplain]')
            ?.getAttribute('xplain');
          return sharhId;
        })
        .filter((sharhId) => sharhId !== undefined)
        .map((sharhId) => getSharhById(sharhId)),
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
