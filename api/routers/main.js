const router = require('express').Router();
const MainController = require('../controllers/main');

router.get('/', MainController.index);
router.get('/sites(/*)?', MainController.index);
router.get('/robots.txt', MainController.robots);

module.exports = router;
