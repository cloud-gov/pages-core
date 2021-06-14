const router = require('express').Router();

const MainController = require('../controllers/main');
const csrfProtection = require('../policies/csrfProtection');

router.get('/', MainController.home);
router.get('/system-use', MainController.systemUse);

// add csrf middleware to app route so that we can use request.csrfToken()
router.get('/sites(/*)?', csrfProtection, MainController.app);
router.get('/robots.txt', MainController.robots);

router.get('/404-not-found/', MainController.notFound);

router.post('/_/csp-violation-report', (req, res) => {
  // This doesn't actually have to do anything since we can look at the requests in the network tab
  res.json({});
});

module.exports = router;
