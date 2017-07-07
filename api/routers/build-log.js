const router = require('express').Router();
const BuildLogController = require('../controllers/build-log');
const buildCallback = require('../policies/buildCallback');
const sessionAuth = require('../policies/sessionAuth');

router.get('/v0/build/:build_id/log', sessionAuth, BuildLogController.find);
router.post('/v0/build/:build_id/log/:token', buildCallback, BuildLogController.create);

module.exports = router;
