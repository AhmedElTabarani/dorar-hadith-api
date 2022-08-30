const getJSON = require('get-json');
const { decode } = require('html-entities');
module.exports = async (query, next) => {
  try {
    query.page = query.page || 1;
    const url = `https://dorar.net/dorar_api.json?skey=${query.value}&page=${query.page}`;

    const data = await getJSON(encodeURI(url));
    const html = decode(data.ahadith.result);
    const allHadith = getAllHadith(html);
    const allHadithInfo = getAllHadithInfo(html);

    const result = allHadith.map((hadith, index) => {
      return {
        ...hadith,
        ...allHadithInfo[index],
      };
    });
    return result;
  } catch (err) {
    next(new Error(err));
  }
};

const getAllHadith = (html) => {
  const allHadith = [];
  const allHadithHTML = html.matchAll(
    /<div class="hadith".*?>(.*?)<\/div>/g
  );
  for (const hadith of allHadithHTML) {
    const _hadith = hadith[1]
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/^\d+ -/g, '')
      .trim();

    allHadith.push({
      hadith: _hadith,
    });
  }
  return allHadith;
};

const getAllHadithInfo = (html) => {
  const allHadithInfo = [];
  const allHadithInfoHTML = html.matchAll(
    /<div class="hadith-info">([\s\S]*?)<\/div>/g
  );
  for (const hadithInfo of allHadithInfoHTML) {
    const _hadithInfo = hadithInfo[1]
      .replace(/<\/?[^>]+(>|$)/g, '')
      .trim();
    const el_rawi = _hadithInfo.match(/الراوي: ([\s\S]*?) (?=المحدث)/);
    const el_mohdith = _hadithInfo.match(/المحدث: ([\s\S]*?) (?=المصدر)/);
    const source = _hadithInfo.match(
      /المصدر: ([\s\S]*?) (?=الصفحة أو الرقم)/
    );
    const number_or_page = _hadithInfo.match(
      /الصفحة أو الرقم: ([\s\S]*?) (?=خلاصة حكم المحدث)/
    );
    const grade = _hadithInfo.match(/خلاصة حكم المحدث: ([\s\S]*?)$/);

    allHadithInfo.push({
      el_rawi: el_rawi[1].trim(),
      el_mohdith: el_mohdith[1].trim(),
      source: source[1].trim(),
      number_or_page: number_or_page[1].trim(),
      grade: grade[1].trim(),
    });
  }
  return allHadithInfo;
};
