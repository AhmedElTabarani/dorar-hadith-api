const context = require('../../utils/requestContext');
const AppError = require('../../utils/AppError');
const pending = new Map();
const canonical = value => Array.isArray(value) ? value.map(canonical).sort() : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
function wrap(name, fn) {
  return async (...args) => {
    const key = name + ':' + JSON.stringify(canonical(args));
    const signal = context.getStore()?.signal;
    signal?.throwIfAborted();
    let entry = pending.get(key);
    if (!entry) {
      if (pending.size >= 128) throw new AppError('Too many pending source operations', 503);
      const controller = new AbortController();
      entry = { controller, waiters: 0 };
      entry.promise = Promise.resolve().then(() => context.run({ signal: controller.signal }, () => fn(...args))).finally(() => pending.delete(key));
      pending.set(key, entry);
    }
    entry.waiters++;
    let listener;
    try {
      const aborted = new Promise((_, reject) => { listener = () => reject(new AppError('Request cancelled', 499)); signal?.addEventListener('abort', listener, { once: true }); });
      return await Promise.race([entry.promise, aborted]);
    } finally {
      signal?.removeEventListener('abort', listener);
      if (--entry.waiters === 0) entry.controller.abort();
    }
  };
}
module.exports = functions => Object.fromEntries(Object.entries(functions).map(([name, fn]) => [name, wrap(name, fn)]));
