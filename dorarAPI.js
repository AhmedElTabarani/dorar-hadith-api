const getJSON = require('get-json');
const { decode } = require('html-entities');
module.exports = async (query) => {
  const json = [];
  query.page = query.page || 1;
  const url = `https://dorar.net/dorar_api.json?skey=${query.value}&page=${query.page}`;

  const data = await getJSON(encodeURI(url));
  const html = decode(data.ahadith.result);
  const allHadith = html.matchAll(/<div class="hadith".*?>(.*?)<\/div>/g);
  const allHadithInfo = html.matchAll(
    /<div class="hadith-info">([\s\S]*?)<\/div>/g
  );
  for (const hadith of allHadith) {
    const _hadith = hadith[1]
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/^\d+ -/g, '')
      .trim();
    json.push({
      hadith: _hadith,
    });
  }
  let i = 0;
  for (const hadithInfo of allHadithInfo) {
    const _hadithInfo = hadithInfo[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
    const el_rawi = _hadithInfo.match(/الراوي: ([\s\S]*?) (?=المحدث)/);
    const el_mohdith = _hadithInfo.match(/المحدث: ([\s\S]*?) (?=المصدر)/);
    const source = _hadithInfo.match(/المصدر: ([\s\S]*?) (?=الصفحة أو الرقم)/);
    const number_or_page = _hadithInfo.match(
      /الصفحة أو الرقم: ([\s\S]*?) (?=خلاصة حكم المحدث)/
    );
    const grade = _hadithInfo.match(/خلاصة حكم المحدث: ([\s\S]*?)$/);
    json[i]['el_rawi'] = el_rawi[1].trim();
    json[i]['el_mohdith'] = el_mohdith[1].trim();
    json[i]['source'] = source[1].trim();
    json[i]['number_or_page'] = number_or_page[1].trim();
    json[i]['grade'] = grade[1].trim();
    i++;
  }
  return json;
};
