module.exports = (params) => Object.entries(params)
    .map(([key, value]) => 
      Array.isArray(value) 
        ? value.map(v => `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`).join('&')
        : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
