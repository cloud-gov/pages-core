const router = require('express').Router();

const MainController = require('../controllers/main');
const { csrfProtection } = require('../middlewares');

router.get('/', MainController.home);
router.get('/system-use', MainController.systemUse);

// add csrf middleware to app route so that we can use request.csrfToken()
router.get('/organizations(/*)?', csrfProtection, MainController.app);
router.get('/sites(/*)?', csrfProtection, MainController.app);
router.get('/robots.txt', MainController.robots);

router.get('/404-not-found/', MainController.notFound);

module.exports = router;
