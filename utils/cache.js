const NodeCache = require('node-cache');
const config = require('../config/config');
module.exports = new NodeCache({ stdTTL: config.cacheEach });
