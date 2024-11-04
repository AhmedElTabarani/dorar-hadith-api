const router = require('express').Router();
const SharhSearchController = require('../controllers/sharhSearch.controller');
const {
  validateSharhSearch,
  validateSharhId,
  validateSharhText
} = require('../middleware/validators');

// Search route
router
  .route('/site/sharh/search')
  .get(validateSharhSearch, SharhSearchController.getAllSharhUsingSiteDorar);

// Text-based search route
router
  .route('/site/sharh/text/:text')
  .get(validateSharhText, SharhSearchController.getOneSharhByTextUsingSiteDorar);

// ID-based route
router
  .route('/site/sharh/:id')
  .get(validateSharhId, SharhSearchController.getOneSharhByIdUsingSiteDorar);

module.exports = router;
