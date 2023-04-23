const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { JSDOM } = require('jsdom');

const sharhById = require('./dorarOneSharhById');
const cache = require('./cache');

module.exports = async (text, req, next) => {
  try {
    const url = `https://www.dorar.net/hadith/search?q=${text}&st=p`;

    if (cache.has(url)) return cache.get(url);

    const res = await nodeFetch(url);
    const html = decode(await res.text());
    const doc = new JSDOM(html).window.document;

    const sharhId = doc.querySelector('a[xplain]')?.getAttribute('xplain');

    const result = await sharhById(sharhId);

    cache.set(url, result);

    return result;
  } catch (err) {
    next(new Error(err));
  }
};
