const router = require('express').Router();
const SiteController = require('../controllers/site');
const { csrfProtection, sessionAuth } = require('../middlewares');
const SiteUserController = require('../controllers/site-user');

// enable csrf protection for all site routes
// note that this must come before the route definitions
router.use(csrfProtection);

router.get('/site', sessionAuth, SiteController.findAllForUser);
router.post('/site/user', sessionAuth, SiteController.addUser);
router.delete('/site/:site_id/user/:user_id', sessionAuth, SiteController.removeUser);
router.post('/site', sessionAuth, SiteController.create);
router.get('/site/:id', sessionAuth, SiteController.findById);
router.put('/site/:id', sessionAuth, SiteController.update);
router.delete('/site/:id', sessionAuth, SiteController.destroy);
router.put('/site/:site_id/notifications', sessionAuth, SiteUserController.updateNotificationSettings);

router.post('/site/:site_id/basic-auth', sessionAuth, SiteController.addBasicAuth);
router.delete('/site/:site_id/basic-auth', sessionAuth, SiteController.removeBasicAuth);
module.exports = router;
