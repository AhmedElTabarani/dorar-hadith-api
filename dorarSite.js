const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const cache = require('./cache');

module.exports = async (query, req, next) => {
  try {
    const url = `https://www.dorar.net/hadith/search?${query}`;

    if (cache.has(url)) return cache.get(url);

    const res = await nodeFetch(url);
    const html = decode(await res.text());
    const doc = parseHTML(html).document;

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

      const subtitles = [
        ...info.children[1].querySelectorAll('.primary-text-color'),
      ].map((el) => el.textContent.trim());

      const sharhId = info
        .querySelector('a[xplain]')
        ?.getAttribute('xplain');

      return {
        hadith,
        el_rawi: subtitles[0],
        el_mohdith: subtitles[1],
        source: subtitles[2],
        number_or_page: subtitles[3],
        grade: subtitles[4],
        hasSharhMetadata: !!sharhId,
        sharhMetadata: sharhId
          ? {
              id: sharhId,
              isCantainSharh: false,
              urlToGetSharh: `/site/oneSharhBy?id=${sharhId}`,
            }
          : undefined,
      };
    });

    cache.set(url, result);

    return result;
  } catch (err) {
    next(new Error(err));
  }
};
