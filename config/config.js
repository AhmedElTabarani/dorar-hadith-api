const toNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

module.exports = config = {
  /** @type {number}
   * @description default port to localhost
   * @default 5000
   */
  port: toNumber(process.env.PORT, 5000),

  /** @type {number}
   * @description max number of requests
   * @default 100
   */
  rateLimitMax: toNumber(process.env.RATE_LIMIT_MAX, 100),

  /** @type {number}
   * @description time between requests
   * @default 24 hours
   * @example 24 * 60 * 60 * 1000 // 24 hours
   */
  rateLimitEach: toNumber(process.env.RATE_LIMIT_EACH, 24 * 60 * 60 * 1000),

  /** @type {number}
   * @description time between cache updates
   * @default 5 seconds
   * @example 5 * 1000 // 5 seconds
   */
  cacheEach: toNumber(process.env.CACHE_EACH, 5),

  /** @type {number}
   * @description timeout for fetch requests
   * @default 15000 // 15 seconds
   */
  fetchTimeout: toNumber(process.env.FETCH_TIMEOUT, 15000),

  /** @type {number}
   * @description page size for Dorar API hadith search
   * @default 15
   */
  hadithApiPageSize: toNumber(process.env.HADITH_API_PAGE_SIZE, 15),

  /** @type {number}
   * @description page size for Dorar site hadith search
   * @default 30
   */
  hadithSitePageSize: toNumber(process.env.HADITH_SITE_PAGE_SIZE, 30),

  /** @type {string}
   * @description timeout for express timeout middleware
   * @default 30s // 30 seconds
   */
  expressTimeout: process.env.EXPRESS_TIMEOUT || '30s',

  /** @type {string}
   * @description limit for express.json middleware
   * @default 10kb
   */
  expressJsonLimit: process.env.EXPRESS_JSON_LIMIT || '10kb',
};
