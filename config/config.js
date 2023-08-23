module.exports = config = {
  /** @type {number}
   * @description default port to localhost
   * @default 5000
   */
  port: 5000,

  /** @type {number}
   * @description max number of requests
   * @default 100
   */
  rateLimitMax: 100,

  /** @type {number}
   * @description time between requests
   * @default 24 hours
   * @example 24 * 60 * 60 * 1000 // 24 hours
   */
  rateLimitEach: 24 * 60 * 60 * 1000,

  /** @type {number}
   * @description time between cache updates
   * @default 5 seconds
   * @example 5 * 1000 // 5 seconds
   */
  cacheEach: 5,
};
