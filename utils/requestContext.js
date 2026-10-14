const { AsyncLocalStorage } = require('node:async_hooks');
module.exports = new AsyncLocalStorage();
