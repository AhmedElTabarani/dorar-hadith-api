const catchAsync = require('../utils/catchAsync');
const sendSuccess = require('../utils/sendSuccess');
const bookSearchService = require('../services/dorar/bookSearch.service');

class BookSearchController {
  getOneBookByIdUsingSiteDorar = catchAsync(
    async (req, res, next) => {
      const response = await bookSearchService.getOneBookByIdUsingSiteDorar({
        bookId: req.params.id,
      });

      sendSuccess(res, 200, response.data, {
        ...response.metadata,
        isCached: response.isCached,
      });
    },
  );
}

module.exports = new BookSearchController();
