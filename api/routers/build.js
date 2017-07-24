const router = require('express').Router();
const BuildController = require('../controllers/build');
const buildCallback = require('../policies/buildCallback');
const sessionAuth = require('../policies/sessionAuth');

router.get('/v0/site/:site_id/build', sessionAuth, BuildController.find);
router.post('/v0/build', sessionAuth, BuildController.create);
router.get('/v0/build/:id', sessionAuth, BuildController.findOne);
router.post('/v0/build/:id/status/:token', buildCallback, BuildController.status);

module.exports = router;
