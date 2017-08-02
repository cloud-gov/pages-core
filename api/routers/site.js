const router = require('express').Router();
const SiteController = require('../controllers/site');
const sessionAuth = require('../policies/sessionAuth');

router.get('/site', sessionAuth, SiteController.find);
router.post('/site', sessionAuth, SiteController.create);
router.get('/site/:id', sessionAuth, SiteController.findOne);
router.put('/site/:id', sessionAuth, SiteController.update);
router.delete('/site/:id', sessionAuth, SiteController.destroy);

module.exports = router;
