const router = require('express').Router();
const OrganizationController = require('../controllers/organization');
const OrganizationRoleController = require('../controllers/organization-role');
const { csrfProtection, sessionAuth } = require('../middlewares');

router.use(sessionAuth);
router.use(csrfProtection);

router.get('/organization', OrganizationController.findAllForUser);
router.get('/organization/:id', OrganizationController.findOneForUser);
router.post('/organization/:id/invite', OrganizationController.invite);
router.post('/organization/:id/resend-invite', OrganizationController.resendInvite);
router.get('/organization/:id/members', OrganizationController.members);
// roles
router.delete('/organization/:org_id/user/:user_id', OrganizationRoleController.destroy);

module.exports = router;
