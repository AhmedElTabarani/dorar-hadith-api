const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const cache = require('./cache');

module.exports = async (sourceId, req, next) => {
  try {
    if (!sourceId) throw `Can't find source with this id`;
    const url = `https://www.dorar.net/hadith/book-card/${sourceId}`;

    if (cache.has(url)) return cache.get(url);

    const res = await nodeFetch(url);
    if (res.status === 404) throw `Can't find source with this id`;

    const html = decode(await res.json());
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
      sourceId,
      author,
      reviewer,
      publisher,
      edition,
      editionYear: editionYear.match(/^\d+/)[0],
    };

    cache.set(url, result);

    return result;
  } catch (err) {
    next(new Error(err));
  }
};
