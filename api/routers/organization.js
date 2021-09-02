const router = require('express').Router();
const OrganizationController = require('../controllers/organization');
const { csrfProtection, sessionAuth } = require('../middlewares');

router.use(sessionAuth);
router.use(csrfProtection);

router.get('/organization', OrganizationController.findAllForUser);
router.get('/organization/:id', OrganizationController.findOneForUser);
router.post('/organization/:id/invite', OrganizationController.invite);
router.get('/organization/:id/members', OrganizationController.members);

module.exports = router;
