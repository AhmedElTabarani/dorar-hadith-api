const getSimilarHadithDorar = require('../../utils/getSimilarHadithDorar');
const getHadithId = require('../../utils/getHadithId');
const getAlternateHadithSahihDorar = require('../../utils/getAlternateHadithSahihDorar');
const getUsulHadithDorar = require('../../utils/getUsulHadithDorar');
const { parseHadithInfo } = require('../../utils/parseHadithInfo');
const { parseHadithCategories } = require('../../utils/parseHadithCategories');

const cleanHadithText = (text, regex) => text.replace(regex, '').trim();

const buildSharhMetadata = (sharhId) => {
  if (!sharhId) {
    return undefined;
  }

  return {
    id: sharhId,
    isContainSharh: false,
    urlToGetSharh: `/v1/site/sharh/${sharhId}`,
  };
};

const addLinkMetadata = ({
  hadithId,
  similarHadithDorar,
  alternateHadithSahihDorar,
  usulHadithDorar,
}) => ({
  urlToGetSimilarHadith: similarHadithDorar
    ? `/v1/site/hadith/similar/${hadithId}`
    : undefined,
  urlToGetAlternateHadithSahih: alternateHadithSahihDorar
    ? `/v1/site/hadith/alternate/${hadithId}`
    : undefined,
  urlToGetUsulHadith: usulHadithDorar
    ? `/v1/site/hadith/usul/${hadithId}`
    : undefined,
});

const mapSiteHadithBlock = (container, options = {}) => {
  const {
    removeHTML = true,
    hadithNode = container.children[0],
    infoNode = container.children[1],
    hadithCleanRegex = /\d+\s+-/g,
    includeAlternate = true,
  } = options;

  const hadith = removeHTML
    ? cleanHadithText(hadithNode.textContent, hadithCleanRegex)
    : cleanHadithText(hadithNode.innerHTML, hadithCleanRegex);

  const parsedInfo = parseHadithInfo(infoNode || container);
  const {
    rawi,
    mohdith,
    mohdithId,
    book,
    bookId,
    numberOrPage,
    grade,
    explainGrade,
    takhrij,
    sharhId,
  } = parsedInfo;

  const similarHadithDorar = getSimilarHadithDorar(container);
  const alternateHadithSahihDorar = includeAlternate
    ? getAlternateHadithSahihDorar(container)
    : undefined;
  const usulHadithDorar = getUsulHadithDorar(container);
  const hadithId = getHadithId(container);
  const categories = parseHadithCategories(container);

  return {
    hadith,
    rawi,
    mohdith,
    mohdithId,
    book,
    bookId,
    numberOrPage,
    grade,
    explainGrade,
    takhrij,
    hadithId,
    categories,
    hasSimilarHadith: !!similarHadithDorar,
    hasAlternateHadithSahih: !!alternateHadithSahihDorar,
    hasUsulHadith: !!usulHadithDorar,
    similarHadithDorar,
    alternateHadithSahihDorar,
    usulHadithDorar,
    ...addLinkMetadata({
      hadithId,
      similarHadithDorar,
      alternateHadithSahihDorar,
      usulHadithDorar,
    }),
    hasSharhMetadata: !!sharhId,
    sharhMetadata: buildSharhMetadata(sharhId),
  };
};

const mapApiHadithInfo = (info, removeHTML) => {
  const hadithNode = info.previousElementSibling;
  const hadith = removeHTML
    ? hadithNode.textContent.replace(/\d+ -/g, '').trim()
    : hadithNode.innerHTML.replace(/\d+ -/g, '').trim();

  const [rawi, mohdith, book, numberOrPage, grade] = [
    ...info.querySelectorAll('.info-subtitle'),
  ].map((el) => {
    let nextEle = el.nextSibling;
    while (nextEle && nextEle.textContent.trim().length === 0) {
      nextEle = nextEle.nextSibling;
    }
    return nextEle ? nextEle.textContent.trim() : '';
  });

  return {
    hadith,
    rawi,
    mohdith,
    book,
    numberOrPage,
    grade,
  };
};

const extractUsulSources = (document) => {
  const usulSources = [];
  const articles = document.querySelectorAll('article');

  for (let i = 1; i < articles.length; i += 1) {
    const sourceInfo = articles[i].querySelector('h5');
    if (!sourceInfo) {
      continue;
    }

    const sourceSpan = sourceInfo.querySelector('span[style*="color:maroon"]');
    const chainSpan = sourceInfo.querySelector('span[style*="color:blue"]');

    const source = sourceSpan?.textContent.trim() || '';
    const chain = chainSpan?.textContent.trim() || '';

    let fullText = sourceInfo.textContent.trim();
    if (source) {
      fullText = fullText.replace(source, '').trim();
    }
    if (chain) {
      fullText = fullText.replace(chain, '').trim();
    }

    const hadithText = fullText.replace(/^[،,.\s]+/, '').trim();
    usulSources.push({ source, chain, hadithText });
  }

  return usulSources;
};

module.exports = {
  mapSiteHadithBlock,
  mapApiHadithInfo,
  extractUsulSources,
};
