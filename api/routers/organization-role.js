const router = require('express').Router();
const OrganizationRoleController = require('../controllers/organization-role');
const sessionAuth = require('../policies/sessionAuth');
const csrfProtection = require('../policies/csrfProtection');

router.use(sessionAuth);
router.use(csrfProtection);

router.get('/organization-role', OrganizationRoleController.findAllForUser);
router.delete('/organization-role', OrganizationRoleController.destroy);
router.put('/organization-role', OrganizationRoleController.update);

module.exports = router;
