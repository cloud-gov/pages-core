const router = require('express').Router();
const MainController = require('../controllers/main');

router.get('/', MainController.home);

router.get('/sites(/*)?', MainController.app);
router.get('/robots.txt', MainController.robots);

module.exports = router;
