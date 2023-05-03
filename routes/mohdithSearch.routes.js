const router = require('express').Router();

const MohdithSearchController = require('../controllers/mohdithSearch.controller');

router
  .route('/site/mohdith/:id')
  .get(MohdithSearchController.getOneMohdithByIdUsingSiteDorar);

module.exports = router;
