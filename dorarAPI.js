const getJSON = require('get-json');
const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const cache = require('./cache');

module.exports = async (query, req, next) => {
  try {
    const url = `https://dorar.net/dorar_api.json?${query}`;

    if (cache.has(url)) return cache.get(url);

    const data = await getJSON(url);
    const html = decode(data.ahadith.result);
    const doc = parseHTML(html).document;

    const result = Array.from(
      doc.querySelectorAll('.hadith-info'),
    ).map((info) => {
      let hadith;
      if (req.isRemoveHTML)
        hadith = info.previousElementSibling.textContent
          .replace(/\d+ -/g, '')
          .trim();
      else
        hadith = info.previousElementSibling.innerHTML
          .replace(/\d+ -/g, '')
          .trim();

      const rawSubtitleElements = [
        ...info.querySelectorAll('.info-subtitle'),
      ];

      const grade = rawSubtitleElements
        .pop()
        .nextElementSibling.textContent.trim();

      const subtitles = rawSubtitleElements.map((el) =>
        el.nextSibling.textContent.trim(),
      );

      return {
        hadith,
        el_rawi: subtitles[0],
        el_mohdith: subtitles[1],
        source: subtitles[2],
        number_or_page: subtitles[3],
        grade,
      };
    });
    cache.set(url, result);

    return result;
  } catch (err) {
    next(new Error(err));
  }
};
