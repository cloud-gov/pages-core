const router = require('express').Router();
const BuildController = require('../controllers/build');
const sessionAuth = require('../policies/sessionAuth');
const csrfProtection = require('../policies/csrfProtection');

router.get('/site/:site_id/build', sessionAuth, BuildController.find);
router.post('/build', sessionAuth, csrfProtection, BuildController.create);
router.post('/build/:id/status/:token', BuildController.status);

module.exports = router;
