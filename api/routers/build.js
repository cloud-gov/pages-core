const router = require('express').Router();
const BuildController = require('../controllers/build');
const { csrfProtection, sessionAuth } = require('../middlewares');

router.get('/site/:site_id/build', sessionAuth, BuildController.find);
router.get('/build/:id', sessionAuth, BuildController.findById);
router.post('/build', sessionAuth, csrfProtection, BuildController.create);
router.post('/build/:id/status/:token', BuildController.status);

module.exports = router;
