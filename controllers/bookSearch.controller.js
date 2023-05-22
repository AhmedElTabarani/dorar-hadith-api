const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const cache = require('../utils/cache');

class BookSearchController {
  getOneBookByIdUsingSiteDorar = catchAsync(
    async (req, res, next) => {
      const bookId = req.params.id;
      if (!bookId)
        return next(new Error(`Can't find book with this id`));

      const url = `https://www.dorar.net/hadith/book-card/${bookId}`;

      if (cache.has(url)) {
        const result = cache.get(url);
        return sendSuccess(res, 200, result, {
          isCached: true,
        });
      }

      const data = await nodeFetch(url);
      if (data.status === 404)
        return next(new Error(`Can't find book with this id`));

      const html = decode(await data.json());
      const doc = parseHTML(html).document;

      const name = doc
        .querySelector('h5')
        .textContent.replace(/^\d+\s-/, '')
        .trim();

      const [author, reviewer, publisher, edition, editionYear] = doc
        .querySelectorAll('span')
        .map((el) => el.textContent.trim());

      const result = {
        name,
        bookId,
        author,
        reviewer,
        publisher,
        edition,
        editionYear: editionYear.match(/^\d+/)[0],
      };

      cache.set(url, result);
      sendSuccess(res, 200, result, {
        isCached: false,
      });
    },
  );
}

module.exports = new BookSearchController();
