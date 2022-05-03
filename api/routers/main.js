const router = require('express').Router();

const MainController = require('../controllers/main');
const { csrfProtection, parseForm } = require('../middlewares');

router.get('/', MainController.home);
router.get('/system-use', MainController.systemUse);

router.get('/migrate/new', csrfProtection, MainController.migrateNew);
router.post('/migrate/create', parseForm, csrfProtection, MainController.migrateCreate);
router.get('/migrate/success', MainController.migrateSuccess);

// add csrf middleware to app route so that we can use request.csrfToken()
router.get('/organizations(/*)?', csrfProtection, MainController.app);
router.get('/sites(/*)?', csrfProtection, MainController.app);
router.get('/settings', csrfProtection, MainController.app);

router.get('/robots.txt', MainController.robots);

router.options('(/*)?', (_req, res) => res.notFound());

module.exports = router;
