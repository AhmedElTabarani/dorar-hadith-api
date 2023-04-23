const NodeCache = require('node-cache');
module.exports = new NodeCache({ stdTTL: 60 * 5 }); // cache for 5 minutes
