const AppError = require('./AppError');
const config = require('../config/config');
const context = require('./requestContext');
const { consumeBudget } = require('../services/common/store');
const metrics = require('./metrics');
let active = 0, failures = 0, openUntil = 0;
module.exports = async (url, options = {}) => {
  const target = new URL(url);
  if (target.protocol !== 'https:' || !['dorar.net', 'www.dorar.net'].includes(target.hostname)) throw new AppError('Invalid upstream host', 400);
  if (openUntil > Date.now()) throw new AppError('Source circuit is open', 503);
  if (active >= 8) throw new AppError('Upstream concurrency limit reached', 503);
  active++; metrics.add('source_requests');
  const signals = [AbortSignal.timeout(config.fetchTimeout), options.signal, context.getStore()?.signal].filter(Boolean);
  const signal = AbortSignal.any(signals);
  try {
    signal.throwIfAborted();
    await consumeBudget('dorar', Number(process.env.UPSTREAM_REQUESTS_PER_MINUTE || 30));
    const response = await fetch(url, { ...options, redirect: 'error', signal, headers: {
      'User-Agent': 'Tathabbat/2.0', Accept: 'application/json, text/html', 'Accept-Language': 'ar', ...options.headers
    }});
    if (!response.ok) throw new AppError('Source request failed', response.status === 404 ? 404 : response.status === 429 ? 429 : 502);
    // Consume the entire body within the same deadline; cap response memory.
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      signal.throwIfAborted(); size += chunk.length;
      if (size > 4 * 1024 * 1024) throw new AppError('Source response too large', 502);
      chunks.push(Buffer.from(chunk));
    }
    signal.throwIfAborted();
    metrics.add('source_success');
    failures = 0;
    return new Response(Buffer.concat(chunks), { status: response.status, headers: response.headers });
  } catch (error) {
    metrics.add('source_failures');
    if ((!error.statusCode || error.statusCode >= 500) && ++failures >= 5) { metrics.add('circuit_opened'); openUntil = Date.now() + 30000; failures = 0; }
    if (signal.aborted) throw new AppError('Source deadline exceeded', 504);
    throw error;
  } finally { active--; }
};
