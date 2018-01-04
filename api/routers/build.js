const router = require('express').Router();
const BuildController = require('../controllers/build');
const buildCallback = require('../policies/buildCallback');
const sessionAuth = require('../policies/sessionAuth');
const csrfProtection = require('../policies/csrfProtection');

router.get('/site/:site_id/build', sessionAuth, BuildController.find);
router.post('/build', sessionAuth, csrfProtection, BuildController.create);
router.get('/build/:id', sessionAuth, BuildController.findOne);
router.post('/build/:id/status/:token', buildCallback, BuildController.status);

module.exports = router;
