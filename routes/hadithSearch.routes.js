const router = require('express').Router();

const HadithSearchController = require('../controllers/hadithSearch.controller');

router
  .route('/api/hadith/search')
  .get(HadithSearchController.searchUsingAPIDorar);

router
  .route('/site/hadith/search')
  .get(HadithSearchController.searchUsingSiteDorar);

module.exports = router;
