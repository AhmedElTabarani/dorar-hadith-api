const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { JSDOM } = require('jsdom');

const cache = require('./cache');

module.exports = async (id, req, next) => {
  try {
    if (!id) return;
    const url = `https://www.dorar.net/hadith/sharh/${id}`;

    if (cache.has(url)) return cache.get(url);

    const res = await nodeFetch(url);
    const html = decode(await res.text());
    const doc = new JSDOM(html).window.document;

    const hadith = doc
      .querySelector('article')
      .textContent.replace(/\d+ -/g, '')
      .trim();

    const subtitles = [...doc.querySelectorAll('.primary-text-color')].map(
      (el) => el.textContent.trim()
    );

    const sharh = doc
      .querySelector('.text-justify')
      .nextElementSibling.textContent.trim();

    const result = {
      hadith,
      el_rawi: subtitles[0],
      el_mohdith: subtitles[1],
      source: subtitles[2],
      number_or_page: subtitles[3],
      grade: subtitles[4],
      sharh,
      sharhId: id,
    };

    cache.set(url, result);

    return result;
  } catch (err) {
    next(new Error(err));
  }
};
