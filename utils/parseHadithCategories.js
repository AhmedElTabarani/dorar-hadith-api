/**
 * Parses thematic categories (التصنيف الموضوعي) from a hadith block.
 * Expects links like: <a href="/hadith-category/cat/{id}">{name}</a> inside .category-badge.
 * @param {Element} container - DOM element that may contain .category-badge (e.g. hadith .border-bottom block)
 * @returns {Array<{ id: string, name: string }>}
 */
function parseHadithCategories(container) {
  if (!container) return [];

  const links = container.querySelectorAll(
    'a[href*="/hadith-category/cat/"]'
  );
  const categories = [];

  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const match = href.match(/\/hadith-category\/cat\/([^/?#]+)/);
    const id = match ? match[1].trim() : null;
    const name = link.textContent.trim();
    if (id && name) {
      categories.push({ id, name });
    }
  }

  return categories;
}

module.exports = {
  parseHadithCategories,
};