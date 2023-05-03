const router = require('express').Router();

const BookSearchController = require('../controllers/bookSearch.controller');

router
  .route('/site/book/:id')
  .get(BookSearchController.getOneBookByIdUsingSiteDorar);

module.exports = router;
