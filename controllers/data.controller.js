const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const dataService = require('../services/data.service');

class DataController {
  getBook = catchAsync(async (req, res, next) => {
    const response = await dataService.getData('book');
    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getDegree = catchAsync(async (req, res, next) => {
    const response = await dataService.getData('degree');
    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getMethodSearch = catchAsync(async (req, res, next) => {
    const response = await dataService.getData('method-search');
    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getMohdith = catchAsync(async (req, res, next) => {
    const response = await dataService.getData('mohdith');
    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getRawi = catchAsync(async (req, res, next) => {
    const response = await dataService.getData('rawi');
    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getZoneSearch = catchAsync(async (req, res, next) => {
    const response = await dataService.getData('zone-search');
    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });
}

module.exports = new DataController();
