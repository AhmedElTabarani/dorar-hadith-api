const AppError = require('./AppError');
const config = require('../config/config');
const { ProxyAgent } = require('undici');
const {
  fetchInBrowser,
} = require('../services/common/dorarBrowser.service');

const proxy = config.dorarProxyUrl
  ? new ProxyAgent(config.dorarProxyUrl)
  : undefined;

const fetchOnce = async (url, options = {}) => {
  const timeout = config.fetchTimeout;
  const headers = new Headers({
    'User-Agent': 'DorarHadithAPI/1.0',
    Accept: 'application/json, text/html;q=0.9, */*;q=0.8',
    'Accept-Language': 'ar,en;q=0.9',
  });
  new Headers(options.headers).forEach((value, key) => {
    headers.set(key, value);
  });
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    let response =
      config.dorarFetchMode === 'browser'
        ? await fetchInBrowser(url, options)
        : await fetch(url, {
            ...options,
            ...(proxy ? { dispatcher: proxy } : {}),
            signal: controller.signal,
            headers,
          });
    clearTimeout(id);

    if (response.status === 403 && config.dorarFetchMode === 'auto') {
      await response.body?.cancel();
      response = await fetchInBrowser(url, options);
    }

    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 403) {
        throw new AppError(
          'Dorar denied upstream access (HTTP 403). Configure DORAR_PROXY_URL with an authorized proxy or ask Dorar to allow this server.',
          502,
        );
      }
      throw new AppError(
        `Failed to fetch data: ${response.statusText}`,
        response.status,
      );
    }

    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new AppError(
        'Request timeout. Please try again later.',
        408,
      );
    }
    if (error instanceof AppError) throw error;
    throw new AppError(
      'Unable to reach Dorar. Check outbound access and DORAR_PROXY_URL.',
      502,
    );
  }
};

const pending = new Map();
const fetchWithTimeout = async (url, options = {}) => {
  // Identical concurrent requests share one upstream fetch and each
  // caller receives an independent body. Requests with custom options
  // bypass sharing.
  if (Object.keys(options).length) return fetchOnce(url, options);
  if (!pending.has(url)) {
    pending.set(
      url,
      (async () => {
        try {
          const response = await fetchOnce(url);
          return {
            body: await response.arrayBuffer(),
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          };
        } finally {
          pending.delete(url);
        }
      })(),
    );
  }
  const { body, ...init } = await pending.get(url);
  return new Response(
    [204, 205, 304].includes(init.status) ? null : body,
    init,
  );
};

module.exports = fetchWithTimeout;
