const router = require('express').Router();

const HadithSearchController = require('../controllers/hadithSearch.controller');

router
  .route('/api/hadith/search')
  .get(HadithSearchController.searchUsingAPIDorar);

router
  .route('/site/hadith/search')
  .get(HadithSearchController.searchUsingSiteDorar);

router
  .route('/site/hadith/similar/:id')
  .get(HadithSearchController.getAllSimilarHadithUsingSiteDorar);

router
  .route('/site/hadith/alternate/:id')
  .get(HadithSearchController.getAlternateHadithUsingSiteDorar);

router
  .route('/site/hadith/:id')
  .get(HadithSearchController.getOneHadithUsingSiteDorarById);

module.exports = router;
