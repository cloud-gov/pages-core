const router = require('express').Router();
const SiteController = require('../controllers/site');
const sessionAuth = require('../policies/sessionAuth');

router.get('/v0/site', sessionAuth, SiteController.find);
router.post('/v0/site', sessionAuth, SiteController.create);
router.get('/v0/site/:id', sessionAuth, SiteController.findOne);
router.put('/v0/site/:id', sessionAuth, SiteController.update);
router.delete('/v0/site/:id', sessionAuth, SiteController.destroy);

module.exports = router;
