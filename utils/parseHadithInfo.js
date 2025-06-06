/**
 * Parses hadith information from a DOM element.
 * @param {Element} infoElement
 * @returns {Object}
 */
function parseHadithInfo(infoElement) {
  const result = {
    rawi: '',
    mohdith: '',
    book: '',
    numberOrPage: '',
    grade: '',
    explainGrade: '',
    takhrij: '',
    mohdithId: null,
    bookId: null,
    sharhId: null,
  };

  const labelsMap = {
    rawi: 'الراوي',
    mohdith: 'المحدث',
    book: 'المصدر',
    numberOrPage: 'الصفحة أو الرقم',
    grade: 'درجة الحديث',
    explainGrade: 'خلاصة حكم المحدث',
    takhrij: 'التخريج',
  };

    const normalizeText = (text) => {
    return text
        .split(":")[0]
        .replace(/\|/g, "")
        .trim();
    };

  const strongElements = [...infoElement.querySelectorAll('strong')];

  for (const strong of strongElements) {
      const label = normalizeText(strong.textContent);

      for (const [key, expectedLabel] of Object.entries(labelsMap)) {
          if (label.includes(expectedLabel)) {
              const span = strong.querySelector('span');
              if (span) {
                  result[key] = span.textContent.trim();
              }
          }
      }
    }

    // Extract mohdithId
    const mohdithLink = infoElement.querySelector('a[view-card="mhd"]');
    if (mohdithLink) {
    result.mohdithId = mohdithLink.getAttribute('card-link')?.match(/\d+/)?.[0] || null;
    }

    // Extract bookId
    const bookLink = infoElement.querySelector('a[view-card="book"]');
    if (bookLink) {
    result.bookId = bookLink.getAttribute('card-link')?.match(/\d+/)?.[0] || null;
    }

  // Extract sharhId if available
  const sharhElement = infoElement.querySelector('a[xplain]');
  const sharhId = sharhElement?.getAttribute('xplain');
  result.sharhId = sharhId && sharhId !== '0' ? sharhId : null;

  return result;
}

module.exports = {
  parseHadithInfo,
};
