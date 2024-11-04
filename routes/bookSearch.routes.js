const router = require('express').Router();
const BookSearchController = require('../controllers/bookSearch.controller');
const { validateBookId } = require('../middleware/validators');

router
  .route('/site/book/:id')
  .get(validateBookId, BookSearchController.getOneBookByIdUsingSiteDorar);

module.exports = router;
