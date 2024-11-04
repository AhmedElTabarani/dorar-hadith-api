const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const cache = require('../utils/cache');
const AppError = require('../utils/AppError');
const fetchWithTimeout = require('../utils/fetchWithTimeout');

class BookSearchController {
  getOneBookByIdUsingSiteDorar = catchAsync(
    async (req, res, next) => {
      const bookId = req.params.id;
      if (!bookId) {
        throw new AppError('Book ID is required', 400);
      }

      const url = `https://www.dorar.net/hadith/book-card/${bookId}`;

      if (cache.has(url)) {
        const result = cache.get(url);
        return sendSuccess(res, 200, result, {
          isCached: true,
        });
      }

      const response = await fetchWithTimeout(url);
      const html = decode(await response.json());
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
