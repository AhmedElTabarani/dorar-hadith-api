const { createHash } = require('node:crypto');
const AppError = require('../../utils/AppError');
const memory = new Map();
let client, connecting;
async function redis() {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = require('redis').createClient({ url: process.env.REDIS_URL, disableOfflineQueue: true, socket: { connectTimeout: 3000, reconnectStrategy: false } });
    client.on('error', () => {});
  }
  if (!client.isOpen) {
    connecting ||= client.connect().finally(() => { connecting = null; });
    await connecting;
  }
  return client;
}
const keyOf = key => 'tathabbat:v2:' + createHash('sha256').update(key).digest('hex');
async function get(key) {
  const r = await redis();
  if (r) { const value = await r.get(keyOf(key)); return value ? JSON.parse(value) : null; }
  const entry = memory.get(key);
  if (!entry || entry.expires <= Date.now()) { memory.delete(key); return null; }
  return structuredClone(entry.value);
}
async function set(key, value, ttl = 60) {
  const r = await redis();
  if (r) return r.set(keyOf(key), JSON.stringify(value), { EX: ttl });
  if (memory.size >= 2000) memory.delete(memory.keys().next().value);
  memory.set(key, { value: structuredClone(value), expires: Date.now() + ttl * 1000 });
}
// A single atomic allowance shared by every replica. Redis failures fail closed.
async function consumeBudget(name, limit, seconds = 60) {
  if (!Number.isInteger(limit) || limit < 1) throw new AppError('Upstream budget disabled', 503);
  const key = 'budget:' + name + ':' + Math.floor(Date.now() / (seconds * 1000));
  const r = await redis();
  let count;
  if (r) count = await r.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n", { keys: [keyOf(key)], arguments: [String(seconds + 1)] });
  else { const entry = memory.get(key); count = (entry && entry.expires > Date.now() ? entry.value : 0) + 1; if (memory.size >= 2000) memory.delete(memory.keys().next().value); memory.set(key, { value: count, expires: Date.now() + (seconds + 1) * 1000 }); }
  if (count > limit) throw new AppError('Upstream budget exhausted', 429);
}
module.exports = { get, set, consumeBudget, redis };
