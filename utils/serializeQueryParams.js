module.exports = params => {
  const query = new URLSearchParams();
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (Array.isArray(value)) [...new Set(value.map(String))].sort().forEach(v => query.append(key.replace(/\[\]$/, '') + '[]', v));
    else if (value !== undefined && value !== null) query.append(key, String(value));
  }
  return query.toString();
};
