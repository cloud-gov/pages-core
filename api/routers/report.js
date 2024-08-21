const router = require('express').Router();

const MainController = require('../controllers/main');
const { csrfProtection } = require('../middlewares');

// add csrf middleware to app route so that we can use request.csrfToken()
router.get('/report(/*)?', csrfProtection, MainController.report);

module.exports = router;
