const router = require('express').Router();
const RoleController = require('../controllers/role');
const { csrfProtection, sessionAuth } = require('../middlewares');

// enable csrf protection for all site routes
// note that this must come before the route definitions
router.use(csrfProtection);

router.get('/role', sessionAuth, RoleController.findAll);

module.exports = router;
