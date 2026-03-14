const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const hadithSearchService = require('../services/dorar/hadithSearch.service');

class HadithSearchController {
  searchUsingAPIDorar = catchAsync(async (req, res, next) => {
    const response = await hadithSearchService.searchUsingAPIDorar({
      queryParams: req.query,
      isRemoveHTML: req.isRemoveHTML,
    });

    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  searchUsingSiteDorar = catchAsync(async (req, res, next) => {
    const response = await hadithSearchService.searchUsingSiteDorar({
      queryParams: req.query,
      tab: req.tab,
      isRemoveHTML: req.isRemoveHTML,
      isForSpecialist: req.isForSpecialist,
    });

    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getOneHadithUsingSiteDorarById = catchAsync(async (req, res, next) => {
    const response = await hadithSearchService.getOneHadithUsingSiteDorarById({
      hadithId: req.params.id,
    });

    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getAllSimilarHadithUsingSiteDorar = catchAsync(async (req, res, next) => {
    const response = await hadithSearchService.getAllSimilarHadithUsingSiteDorar({
      similarId: req.params.id,
    });

    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getAlternateHadithUsingSiteDorar = catchAsync(async (req, res, next) => {
    const response = await hadithSearchService.getAlternateHadithUsingSiteDorar({
      alternateId: req.params.id,
    });

    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getUsulHadithUsingSiteDorar = catchAsync(async (req, res, next) => {
    const response = await hadithSearchService.getUsulHadithUsingSiteDorar({
      usulId: req.params.id,
    });

    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });
}

module.exports = new HadithSearchController();