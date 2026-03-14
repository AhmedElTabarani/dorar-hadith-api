const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const sharhSearchService = require('../services/dorar/sharhSearch.service');

class SharhSearchController {
  getOneSharhByIdUsingSiteDorar = catchAsync(async (req, res, next) => {
    const response = await sharhSearchService.getOneSharhByIdUsingSiteDorar({
      sharhId: req.params.id,
    });

    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getOneSharhByTextUsingSiteDorar = catchAsync(async (req, res, next) => {
    const response = await sharhSearchService.getOneSharhByTextUsingSiteDorar({
      text: req.params.text,
      tab: req.tab,
      isForSpecialist: req.isForSpecialist,
    });

    sendSuccess(res, 200, response.data, {
      ...response.metadata,
      isCached: response.isCached,
    });
  });

  getAllSharhUsingSiteDorar = catchAsync(async (req, res, next) => {
    const response = await sharhSearchService.getAllSharhUsingSiteDorar({
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
}

module.exports = new SharhSearchController();
