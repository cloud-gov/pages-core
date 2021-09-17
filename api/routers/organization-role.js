const router = require('express').Router();
const OrganizationRoleController = require('../controllers/organization-role');
const { csrfProtection, sessionAuth } = require('../middlewares');

router.use(sessionAuth);
router.use(csrfProtection);

router.get('/organization-role', OrganizationRoleController.findAllForUser);
router.delete('/organization-role', OrganizationRoleController.destroy);
router.put('/organization-role', OrganizationRoleController.update);

module.exports = router;
