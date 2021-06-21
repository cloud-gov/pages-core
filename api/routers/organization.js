const router = require('express').Router();
const OrganizationController = require('../controllers/organization');
const sessionAuth = require('../policies/sessionAuth');
const csrfProtection = require('../policies/csrfProtection');

router.use(sessionAuth);
router.use(csrfProtection);

router.get('/organization', OrganizationController.findAllForUser);
router.get('/organization/:id', OrganizationController.findOneForUser);
router.put('/organization/:id', OrganizationController.update);
router.post('/organization/:id/invite', OrganizationController.invite);
router.get('/organization/:id/members', OrganizationController.members);

module.exports = router;
