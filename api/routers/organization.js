const router = require('express').Router();
const OrganizationController = require('../controllers/organization');
const sessionAuth = require('../policies/sessionAuth');
const csrfProtection = require('../policies/csrfProtection');

// enable csrf protection for all site routes
// note that this must come before the route definitions
router.use(csrfProtection);

router.get('/organization', sessionAuth, OrganizationController.findAllForUser);
router.get('/organization/:id', sessionAuth, OrganizationController.findOneForUser);
router.put('/organization/:id', sessionAuth, OrganizationController.update);
router.post('/organization/:id/invite', sessionAuth, OrganizationController.invite);
router.get('/organization/:id/members', sessionAuth, OrganizationController.members);

module.exports = router;
