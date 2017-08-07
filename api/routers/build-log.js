const router = require('express').Router();
const BuildLogController = require('../controllers/build-log');
const buildCallback = require('../policies/buildCallback');
const sessionAuth = require('../policies/sessionAuth');

router.get('/build/:build_id/log', sessionAuth, BuildLogController.find);
router.post('/build/:build_id/log/:token', buildCallback, BuildLogController.create);

module.exports = router;
