const router = require('express').Router();
const HadithSearchController = require('../controllers/hadithSearch.controller');
const {
  validateHadithSearch,
  validateHadithId
} = require('../middleware/validators');

// Search routes
router
  .route('/api/hadith/search')
  .get(validateHadithSearch, HadithSearchController.searchUsingAPIDorar);

router
  .route('/site/hadith/search')
  .get(validateHadithSearch, HadithSearchController.searchUsingSiteDorar);

// ID-based routes
router
  .route('/site/hadith/similar/:id')
  .get(validateHadithId, HadithSearchController.getAllSimilarHadithUsingSiteDorar);

router
  .route('/site/hadith/alternate/:id')
  .get(validateHadithId, HadithSearchController.getAlternateHadithUsingSiteDorar);

router
  .route('/site/hadith/:id')
  .get(validateHadithId, HadithSearchController.getOneHadithUsingSiteDorarById);

module.exports = router;
