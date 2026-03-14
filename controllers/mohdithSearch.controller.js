const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const mohdithSearchService = require('../services/dorar/mohdithSearch.service');

class MohdithSearchController {
  getOneMohdithByIdUsingSiteDorar = catchAsync(
    async (req, res, next) => {
      const response = await mohdithSearchService.getOneMohdithByIdUsingSiteDorar(
        {
          mohdithId: req.params.id,
        },
      );

      sendSuccess(res, 200, response.data, {
        ...response.metadata,
        isCached: response.isCached,
      });
    },
  );
}

module.exports = new MohdithSearchController();
