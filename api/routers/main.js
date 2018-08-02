const router = require('express').Router();

const MainController = require('../controllers/main');
const csrfProtection = require('../policies/csrfProtection');

router.get('/', MainController.home);
router.get('/case-studies/', MainController.examples);
router.get('/content/examples', (req, res) => res.redirect('/case-studies'));
router.get('/contact/', MainController.contact);
router.get('/features/', MainController.features);

// add csrf middleware to app route so that we can use request.csrfToken()
router.get('/sites(/*)?', csrfProtection, MainController.app);
router.get('/robots.txt', MainController.robots);

module.exports = router;
