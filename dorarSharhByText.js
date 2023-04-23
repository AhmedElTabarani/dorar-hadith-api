const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { JSDOM } = require('jsdom');

const oneSharhById = require('./dorarOneSharhById');
const cache = require('./cache');

module.exports = async (text, query, req, next) => {
  try {
    req.query.st ||= 'p';
    const url = `https://www.dorar.net/hadith/search?q=${text}&${query}`;

    if (cache.has(url)) return cache.get(url);

    const res = await nodeFetch(url);
    const html = decode(await res.text());
    const doc = new JSDOM(html).window.document;
    const result = await Promise.all(
      Array.from(doc.querySelectorAll(`#${req.tab} .border-bottom`))
        .map((info) => {
          const sharhId = info
            .querySelector('a[xplain]')
            ?.getAttribute('xplain');
          return sharhId;
        })
        .filter((sharhId) => sharhId !== undefined)
        .map((sharhId) => oneSharhById(sharhId, req, next))
    );

    cache.set(url, result);

    return result;
  } catch (err) {
    next(new Error(err));
  }
};
