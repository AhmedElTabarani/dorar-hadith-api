const router = require('express').Router();

const DataController = require('../controllers/data.controller');

router.route('/data/book').get(DataController.getBook);
router.route('/data/degree').get(DataController.getDegree);
router
  .route('/data/methodSearch')
  .get(DataController.getMethodSearch);
router.route('/data/mohdith').get(DataController.getMohdith);
router.route('/data/rawi').get(DataController.getRawi);
router.route('/data/zoneSearch').get(DataController.getZoneSearch);

module.exports = router;
