const NodeCache = require('node-cache');
module.exports = new NodeCache({ stdTTL: 5 }); // cache for 5 seconds
