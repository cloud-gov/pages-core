const router = require('express').Router();
const BuildLogController = require('../controllers/build-log');
const { sessionAuth } = require('../middlewares');

router.get('/build/:build_id/log(/offset/:offset)?', sessionAuth, BuildLogController.find);

module.exports = router;
