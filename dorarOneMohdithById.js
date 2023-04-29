const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const cache = require('./cache');

module.exports = async (mohdithId, req, next) => {
  try {
    if (!mohdithId) throw `Can't find mohdith with this id`;
    const url = `https://www.dorar.net/hadith/mhd/${mohdithId}`;

    if (cache.has(url)) return cache.get(url);

    const res = await nodeFetch(url);
    if (res.status === 404) throw `Can't find mohdith with this id`;

    const html = decode(await res.text());
    const doc = parseHTML(html).document;

    const name = doc.querySelector('h4').textContent;

    const info = doc
      .querySelector('h4')
      .nextSibling.textContent.trim();

    const result = {
      name,
      mohdithId,
      info,
    };

    cache.set(url, result);

    return result;
  } catch (err) {
    next(new Error(err));
  }
};
