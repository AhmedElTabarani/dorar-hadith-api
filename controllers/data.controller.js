const fs = require('fs');
const rateLimit = require('express-rate-limit'); // Added rate-limit package

const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');

const getData = (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(
      `${__dirname}/../data/${file}.json`,
      'utf-8',
      (err, data) => (err ? reject(err) : resolve(JSON.parse(data))),
    );
  });
};

const limiter = rateLimit({ // Added rate-limiting configuration
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

class DataController {
  getBook = catchAsync(limiter, async (req, res, next) => { // Applied rate limiter
    const result = await getData('book');
    sendSuccess(res, 200, result);
  });

  getDegree = catchAsync(limiter, async (req, res, next) => { // Applied rate limiter
    const result = await getData('degree');
    sendSuccess(res, 200, result);
  });

  getMethodSearch = catchAsync(limiter, async (req, res, next) => { // Applied rate limiter
    const result = await getData('method-search');
    sendSuccess(res, 200, result);
  });

  getMohdith = catchAsync(limiter, async (req, res, next) => { // Applied rate limiter
    const result = await getData('mohdith');
    sendSuccess(res, 200, result);
  });

  getRawi = catchAsync(limiter, async (req, res, next) => { // Applied rate limiter
    const result = await getData('rawi');
    sendSuccess(res, 200, result);
  });

  getZoneSearch = catchAsync(limiter, async (req, res, next) => { // Applied rate limiter
    const result = await getData('zone-search');
    sendSuccess(res, 200, result);
  });
}

module.exports = new DataController();
