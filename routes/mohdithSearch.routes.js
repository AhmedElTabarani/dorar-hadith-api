const router = require('ultimate-express').Router();
const MohdithSearchController = require('../controllers/mohdithSearch.controller');
const { validateMohdithId } = require('../middleware/validators');

router
  .route('/site/mohdith/:id')
  .get(
    validateMohdithId,
    MohdithSearchController.getOneMohdithByIdUsingSiteDorar,
  );

module.exports = router;
