const router = require('express').Router();

const MainController = require('../controllers/main');
const { csrfProtection } = require('../middlewares');

router.get('/', MainController.home);
router.get('/system-use', MainController.systemUse);

// add csrf middleware to app route so that we can use request.csrfToken()
router.get('/organizations{/*splat}', csrfProtection, MainController.app);
router.get('/sites{/*splat}', csrfProtection, MainController.app);
router.get('/settings', csrfProtection, MainController.app);

router.get('/robots.txt', MainController.robots);

router.options('{/*splat}', (_req, res) => res.notFound());

module.exports = router;
