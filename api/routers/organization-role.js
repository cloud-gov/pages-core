const router = require('express').Router();
const OrganizationRoleController = require('../controllers/organization-role');
const sessionAuth = require('../policies/sessionAuth');
const csrfProtection = require('../policies/csrfProtection');

// enable csrf protection for all site routes
// note that this must come before the route definitions
router.use(csrfProtection);

router.get('/organization-role', sessionAuth, OrganizationRoleController.findAllForUser);
router.delete('/organization-role', sessionAuth, OrganizationRoleController.destroy);
router.put('/organization-role', sessionAuth, OrganizationRoleController.update);

module.exports = router;
