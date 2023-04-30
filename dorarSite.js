const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const cache = require('./cache');

module.exports = async (query, req, next) => {
  try {
    const url = `https://www.dorar.net/hadith/search?${query}&all`;

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

      const [
        el_rawi,
        el_mohdith,
        source,
        number_or_page,
        grade,
        explainGradeOrTakhrij,
      ] = [
        ...info.children[1].querySelectorAll('.primary-text-color'),
      ].map((el) => el.textContent.trim());

      // explainGrade appear only in home tab
      // takhrij appear only in specialist tab
      const [explainGrade, takhrij] =
        req.tab === 'home'
          ? [explainGradeOrTakhrij, undefined]
          : [undefined, explainGradeOrTakhrij];

      const sharhId = info
        .querySelector('a[xplain]')
        ?.getAttribute('xplain');

      const mohdithId = info
        .querySelector('a[view-card="mhd"]')
        ?.getAttribute('card-link')
        ?.match(/\d+/)[0];

      const sourceId = info
        .querySelector('a[view-card="book"]')
        ?.getAttribute('card-link')
        ?.match(/\d+/)[0];

      return {
        hadith,
        el_rawi,
        el_mohdith,
        mohdithId,
        source,
        sourceId,
        number_or_page,
        grade,
        explainGrade,
        takhrij,
        hasSharhMetadata: !!sharhId,
        sharhMetadata: sharhId
          ? {
              id: sharhId,
              isContainSharh: false,
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
