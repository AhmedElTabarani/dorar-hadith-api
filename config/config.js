const toNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseProxyUrl = (value) => {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported proxy protocol');
    }
    return url.href;
  } catch {
    throw new Error(
      'DORAR_PROXY_URL must be a valid HTTP or HTTPS proxy URL',
    );
  }
};

const dorarFetchMode = process.env.DORAR_FETCH_MODE || 'auto';
if (!['auto', 'http', 'browser'].includes(dorarFetchMode)) {
  throw new Error('DORAR_FETCH_MODE must be auto, http, or browser');
}
const browserStrategy = process.env.DORAR_BROWSER_STRATEGY || 'reuse';
if (!['reuse', 'isolated'].includes(browserStrategy)) {
  throw new Error(
    'DORAR_BROWSER_STRATEGY must be reuse or isolated',
  );
}

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
  rateLimitEach: toNumber(
    process.env.RATE_LIMIT_EACH,
    24 * 60 * 60 * 1000,
  ),

  /** @type {number}
   * @description time between cache updates
   * @default 300 seconds
   */
  cacheEach: toNumber(process.env.CACHE_EACH, 300),
  cacheStableEach: toNumber(process.env.CACHE_STABLE_EACH, 86400),
  browserStrategy,

  /** @type {number}
   * @description timeout for HTTP response headers
   * @default 15000 // 15 seconds
   */
  fetchTimeout: toNumber(process.env.FETCH_TIMEOUT, 15000),

  /** @type {number}
   * @description budget for Chromium imports, cold startup, and navigation
   * @default 40000 // 40 seconds
   */
  browserFetchTimeout: toNumber(
    process.env.BROWSER_FETCH_TIMEOUT,
    40000,
  ),

  dorarProxyUrl: parseProxyUrl(process.env.DORAR_PROXY_URL),
  dorarFetchMode,
  chromiumExecutablePath: process.env.CHROMIUM_EXECUTABLE_PATH,

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
   * @default 60s // 30s in HTTP-only mode
   */
  expressTimeout:
    process.env.EXPRESS_TIMEOUT ||
    (dorarFetchMode === 'http' ? '30s' : '60s'),

  /** @type {string}
   * @description limit for express.json middleware
   * @default 10kb
   */
  expressJsonLimit: process.env.EXPRESS_JSON_LIMIT || '10kb',
};
