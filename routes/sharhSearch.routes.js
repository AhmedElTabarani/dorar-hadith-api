const router = require('express').Router();

const SharhSearchController = require('../controllers/sharhSearch.controller');

router
  .route('/site/sharh/search')
  .get(SharhSearchController.getAllSharhUsingSiteDorar);
router
  .route('/site/sharh/text/:text')
  .get(SharhSearchController.getOneSharhByTextUsingSiteDorar);
router
  .route('/site/sharh/:id')
  .get(SharhSearchController.getOneSharhByIdUsingSiteDorar);

module.exports = router;
