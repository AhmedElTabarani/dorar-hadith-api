const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const AppError = require('../../utils/AppError');
const fetchWithTimeout = require('../../utils/fetchWithTimeout');
const { getCachedResponse, setCachedResponse } = require('../common/cache.service');

const getOneBookByIdUsingSiteDorar = async ({ bookId }) => {
  if (!bookId) {
    throw new AppError('Book ID is required', 400);
  }

  const url = `https://www.dorar.net/hadith/book-card/${bookId}`;
  const cached = getCachedResponse(url);
  if (cached) {
    return cached;
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

  return setCachedResponse(url, result, {});
};

module.exports = {
  getOneBookByIdUsingSiteDorar,
};
